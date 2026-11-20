-- Disposable PostgreSQL ONLY; apply after 001 and 003. Never apply to Supabase.
-- Credits are conservative reservations, NOT verified Geoapify consumption.
BEGIN;
ALTER TABLE geoapify_disposable.reservation
 ADD COLUMN lifecycle text NOT NULL DEFAULT 'RESERVED'
 CHECK(lifecycle IN ('RESERVED','DISPATCHED','CONSUMED','FAILED_CHARGED','RELEASED','REVIEW_REQUIRED')),
 ADD COLUMN outcome_token text,
 ADD COLUMN finalized_at timestamptz,
 ADD COLUMN dispatched_at timestamptz;
CREATE TABLE geoapify_disposable.reservation_event (
 reservation_id uuid NOT NULL REFERENCES geoapify_disposable.reservation(reservation_id),
 event_token text NOT NULL,
 outcome text NOT NULL CHECK(outcome IN ('DISPATCHED','CONSUMED','FAILED_CHARGED','RELEASED','REVIEW_REQUIRED')),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(reservation_id,event_token)
);
REVOKE ALL ON geoapify_disposable.reservation_event FROM PUBLIC;
-- This function is for trusted server-side callers ONLY; no public grant.
-- Never refund after dispatch or uncertain network outcome.
CREATE OR REPLACE FUNCTION geoapify_disposable.transition(
 p_principal text,p_operation_id text,p_hash text,p_event_token text,p_outcome text
) RETURNS TABLE(applied boolean,lifecycle text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE r geoapify_disposable.reservation%ROWTYPE;
DECLARE previous text;
BEGIN
 IF p_principal IS NULL OR p_operation_id IS NULL OR p_hash IS NULL
 OR p_event_token IS NULL OR p_event_token !~ '^[A-Za-z0-9_-]{12,80}$'
 OR p_outcome NOT IN ('DISPATCHED','CONSUMED','FAILED_CHARGED','RELEASED','REVIEW_REQUIRED')
 OR p_outcome IS NULL THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO r FROM geoapify_disposable.reservation
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF NOT FOUND OR r.payload_hash<>p_hash THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND_OR_MISMATCH'::text; RETURN;
 END IF;
 SELECT e.outcome INTO previous FROM geoapify_disposable.reservation_event e
 WHERE e.reservation_id=r.reservation_id AND e.event_token=p_event_token;
 IF FOUND THEN
  RETURN QUERY SELECT (previous=p_outcome),r.lifecycle,
   CASE WHEN previous=p_outcome THEN 'REPLAY' ELSE 'EVENT_CONFLICT' END; RETURN;
 END IF;
 IF NOT (
  (r.lifecycle='RESERVED' AND p_outcome IN ('DISPATCHED','RELEASED','REVIEW_REQUIRED'))
  OR (r.lifecycle='DISPATCHED' AND p_outcome IN ('CONSUMED','FAILED_CHARGED','REVIEW_REQUIRED'))
  OR (r.lifecycle='REVIEW_REQUIRED' AND p_outcome IN ('CONSUMED','FAILED_CHARGED'))
 ) THEN
  RETURN QUERY SELECT false,r.lifecycle,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 -- Refund ONLY a reservation that has not been dispatched.
 IF p_outcome='RELEASED' THEN
  UPDATE geoapify_disposable.budget SET spent=spent-r.credits WHERE day_utc=r.day_utc;
  -- Minute quota remains conservatively charged: original minute is not stored.
 END IF;
 INSERT INTO geoapify_disposable.reservation_event(reservation_id,event_token,outcome)
 VALUES(r.reservation_id,p_event_token,p_outcome);
 UPDATE geoapify_disposable.reservation SET lifecycle=p_outcome,
  outcome_token=p_event_token,
  dispatched_at=CASE WHEN p_outcome='DISPATCHED' THEN clock_timestamp() ELSE dispatched_at END,
  finalized_at=CASE WHEN p_outcome IN ('CONSUMED','FAILED_CHARGED','RELEASED') THEN clock_timestamp() ELSE finalized_at END
 WHERE reservation_id=r.reservation_id;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
-- Orphaned reservations are NOT auto-refunded. Mark for review only.
CREATE OR REPLACE FUNCTION geoapify_disposable.mark_orphans(p_age interval)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE n integer;
BEGIN
 IF p_age IS NULL OR p_age<interval '5 minutes' THEN RAISE EXCEPTION 'invalid review age'; END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 UPDATE geoapify_disposable.reservation
 SET lifecycle='REVIEW_REQUIRED'
 WHERE lifecycle IN ('RESERVED','DISPATCHED')
 AND created_at < clock_timestamp()-p_age;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.transition(text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.mark_orphans(interval) FROM PUBLIC;
COMMIT;
