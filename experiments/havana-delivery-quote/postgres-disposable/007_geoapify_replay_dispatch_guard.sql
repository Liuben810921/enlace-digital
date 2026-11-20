-- Disposable PostgreSQL ONLY. Apply after 001,003,005.
-- Security fix: a released or terminal reservation MUST NOT be dispatchable on replay.
BEGIN;
CREATE OR REPLACE FUNCTION geoapify_disposable.reserve(
 p_principal text,p_operation_id text,p_hash text,p_credits integer,p_day date
) RETURNS TABLE(committed boolean,reservation_id uuid,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE r geoapify_disposable.reservation%ROWTYPE;
DECLARE remaining integer;
DECLARE minute_start timestamptz;
DECLARE new_id uuid;
BEGIN
 IF p_principal IS NULL OR length(p_principal) NOT BETWEEN 1 AND 128
 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{12,80}$'
 OR p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$'
 OR p_credits IS NULL OR p_credits NOT BETWEEN 1 AND 8 OR p_day IS NULL THEN
  RETURN QUERY SELECT false,NULL::uuid,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO r FROM geoapify_disposable.reservation
 WHERE principal=p_principal AND operation_id=p_operation_id;
 IF FOUND THEN
  IF r.payload_hash<>p_hash OR r.credits<>p_credits THEN
   RETURN QUERY SELECT false,NULL::uuid,'IDEMPOTENCY_CONFLICT'::text;
  ELSIF r.lifecycle='RESERVED' THEN
   RETURN QUERY SELECT true,r.reservation_id,'REPLAY_RESERVED'::text;
  ELSE
   -- Never signal a new usable reservation for DISPATCHED/REVIEW_REQUIRED/terminal states.
   RETURN QUERY SELECT false,r.reservation_id,('RESERVATION_'||r.lifecycle)::text;
  END IF;
  RETURN;
 END IF;
 IF p_day IS DISTINCT FROM (clock_timestamp() AT TIME ZONE 'UTC')::date THEN
  RETURN QUERY SELECT false,NULL::uuid,'INVALID_INPUT'::text; RETURN;
 END IF;
 minute_start := date_trunc('minute',clock_timestamp());
 INSERT INTO geoapify_disposable.budget(day_utc) VALUES(p_day) ON CONFLICT DO NOTHING;
 INSERT INTO geoapify_disposable.minute_budget(minute_utc) VALUES(minute_start) ON CONFLICT DO NOTHING;
 SELECT 2400-spent INTO remaining FROM geoapify_disposable.budget WHERE day_utc=p_day;
 IF remaining<p_credits THEN
  RETURN QUERY SELECT false,NULL::uuid,'DAILY_BUDGET_EXCEEDED'::text; RETURN;
 END IF;
 SELECT 30-spent INTO remaining FROM geoapify_disposable.minute_budget WHERE minute_utc=minute_start;
 IF remaining<p_credits THEN
  RETURN QUERY SELECT false,NULL::uuid,'MINUTE_BUDGET_EXCEEDED'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.budget SET spent=spent+p_credits,updated_at=clock_timestamp() WHERE day_utc=p_day;
 UPDATE geoapify_disposable.minute_budget SET spent=spent+p_credits WHERE minute_utc=minute_start;
 INSERT INTO geoapify_disposable.reservation(principal,operation_id,payload_hash,day_utc,credits)
 VALUES(p_principal,p_operation_id,p_hash,p_day,p_credits)
 RETURNING geoapify_disposable.reservation.reservation_id INTO new_id;
 RETURN QUERY SELECT true,new_id,'RESERVED'::text;
END $$;

-- Explicit dispatch gate: only an unexpired RESERVED record can transition.
-- REVIEW_REQUIRED can only be resolved conservatively as consumed or charged.
CREATE OR REPLACE FUNCTION geoapify_disposable.transition(
 p_principal text,p_operation_id text,p_hash text,p_event_token text,p_outcome text
) RETURNS TABLE(applied boolean,lifecycle text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE r geoapify_disposable.reservation%ROWTYPE;
DECLARE previous text;
BEGIN
 IF p_principal IS NULL OR p_operation_id IS NULL OR p_hash IS NULL
 OR p_event_token IS NULL OR p_event_token !~ '^[A-Za-z0-9_-]{12,80}$'
 OR p_outcome IS NULL OR p_outcome NOT IN ('DISPATCHED','CONSUMED','FAILED_CHARGED','RELEASED','REVIEW_REQUIRED') THEN
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
 IF p_outcome='DISPATCHED' AND r.created_at<clock_timestamp()-interval '5 minutes' THEN
  RETURN QUERY SELECT false,r.lifecycle,'RESERVATION_EXPIRED'::text; RETURN;
 END IF;
 IF p_outcome='RELEASED' THEN
  UPDATE geoapify_disposable.budget SET spent=spent-r.credits WHERE day_utc=r.day_utc;
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
REVOKE ALL ON FUNCTION geoapify_disposable.reserve(text,text,text,integer,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.transition(text,text,text,text,text) FROM PUBLIC;
COMMIT;
