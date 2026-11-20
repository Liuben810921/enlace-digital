-- Disposable PostgreSQL ONLY, apply after 019. Freeze is durable state, not a long SQL lock.
BEGIN;
CREATE OR REPLACE FUNCTION geoapify_disposable.set_trusted_context(
 p_principal text,p_operation_id text,p_revision bigint,p_digest text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE old_context geoapify_disposable.trusted_context%ROWTYPE;
DECLARE outbox_state text;
BEGIN
 IF p_principal IS NULL OR p_operation_id IS NULL OR p_revision IS NULL OR p_revision<0
 OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid context'; END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT state INTO outbox_state FROM geoapify_disposable.dispatch_outbox
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 -- No mutation after final send authorization: it may already have crossed HTTP.
 -- UNKNOWN remains frozen even after a worker crash or lost COMMIT acknowledgement.
 IF outbox_state IN ('SEND_AUTHORIZED','UNKNOWN') THEN
  RAISE EXCEPTION 'context frozen pending outcome reconciliation';
 END IF;
 SELECT * INTO old_context FROM geoapify_disposable.trusted_context
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF FOUND THEN
  IF p_revision<old_context.revision OR (p_revision=old_context.revision AND p_digest<>old_context.digest)
  THEN RAISE EXCEPTION 'stale or conflicting context revision'; END IF;
  IF p_revision=old_context.revision THEN RETURN; END IF;
  UPDATE geoapify_disposable.trusted_context
  SET revision=p_revision,digest=p_digest,updated_at=clock_timestamp()
  WHERE principal=p_principal AND operation_id=p_operation_id;
 ELSE
  INSERT INTO geoapify_disposable.trusted_context(principal,operation_id,revision,digest)
  VALUES(p_principal,p_operation_id,p_revision,p_digest);
 END IF;
 -- READY/CLAIMED were never authorized for transport; quarantine without refund.
 UPDATE geoapify_disposable.dispatch_outbox SET state='QUARANTINED'
 WHERE principal=p_principal AND operation_id=p_operation_id
 AND state IN ('READY','CLAIMED');
END $$;
-- Once terminal outcome has been reconciled, a NEW revision can be recorded.
-- Existing outbox remains terminal; this never authorizes a resend.
REVOKE ALL ON FUNCTION geoapify_disposable.set_trusted_context(text,text,bigint,text) FROM PUBLIC;
COMMIT;
