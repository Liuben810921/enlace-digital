-- Disposable PostgreSQL ONLY. Apply after 015; fail-closed claim revalidation.
BEGIN;
ALTER TABLE geoapify_disposable.dispatch_outbox
 DROP CONSTRAINT dispatch_outbox_state_check;
ALTER TABLE geoapify_disposable.dispatch_outbox
 ADD CONSTRAINT dispatch_outbox_state_check
 CHECK(state IN ('READY','CLAIMED','SUCCEEDED','FAILED_CHARGED','UNKNOWN','QUARANTINED'));
CREATE OR REPLACE FUNCTION geoapify_disposable.claim_dispatch(p_reservation_id uuid,p_claim_token text)
RETURNS TABLE(claimed boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE;
DECLARE ctx geoapify_disposable.trusted_context%ROWTYPE;
DECLARE r geoapify_disposable.reservation%ROWTYPE;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL
 OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}$' THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 -- All participating context writers and dispatch transitions use this lock.
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox
 WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND'::text; RETURN;
 END IF;
 IF o.state<>'READY' THEN
  RETURN QUERY SELECT false,o.state,'ALREADY_CLAIMED_OR_FINAL'::text; RETURN;
 END IF;
 SELECT * INTO ctx FROM geoapify_disposable.trusted_context
 WHERE principal=o.principal AND operation_id=o.operation_id FOR UPDATE;
 SELECT * INTO r FROM geoapify_disposable.reservation
 WHERE reservation_id=o.reservation_id FOR UPDATE;
 IF ctx.principal IS NULL OR ctx.revision IS DISTINCT FROM o.context_revision
 OR ctx.digest IS DISTINCT FROM o.context_digest OR r.reservation_id IS NULL
 OR r.principal IS DISTINCT FROM o.principal OR r.operation_id IS DISTINCT FROM o.operation_id
 OR r.payload_hash IS DISTINCT FROM o.context_digest OR r.lifecycle IS DISTINCT FROM 'DISPATCHED' THEN
  UPDATE geoapify_disposable.dispatch_outbox
  SET state='QUARANTINED' WHERE reservation_id=p_reservation_id;
  RETURN QUERY SELECT false,'QUARANTINED'::text,'CONTEXT_STALE_QUARANTINED'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox
 SET state='CLAIMED',claim_token=p_claim_token,claimed_at=clock_timestamp()
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,'CLAIMED'::text,'CLAIMED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.claim_dispatch(uuid,text) FROM PUBLIC;
COMMIT;
