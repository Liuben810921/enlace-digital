-- Disposable PostgreSQL ONLY. Apply after 019/020; no HTTP transport.
-- A durable freeze survives commit and blocks cooperative context writers.
BEGIN;
CREATE TABLE geoapify_disposable.context_freeze_audit (
 reservation_id uuid PRIMARY KEY REFERENCES geoapify_disposable.reservation(reservation_id),
 principal text NOT NULL, operation_id text NOT NULL,
 frozen_revision bigint NOT NULL, frozen_digest text NOT NULL,
 frozen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 released_at timestamptz,
 UNIQUE(principal,operation_id)
);
REVOKE ALL ON geoapify_disposable.context_freeze_audit FROM PUBLIC;
-- Freeze is installed in the SAME transaction as the final send authorization.
CREATE OR REPLACE FUNCTION geoapify_disposable.authorize_send_once(
 p_reservation_id uuid,p_claim_token text
) RETURNS TABLE(authorized boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE;
DECLARE ctx geoapify_disposable.trusted_context%ROWTYPE;
DECLARE r geoapify_disposable.reservation%ROWTYPE;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL
 OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}$' THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox
 WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND THEN RETURN QUERY SELECT false,NULL::text,'NOT_FOUND'::text; RETURN; END IF;
 IF o.state<>'CLAIMED' OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,o.state,'NOT_CLAIMED_OR_TOKEN_MISMATCH'::text; RETURN;
 END IF;
 SELECT * INTO ctx FROM geoapify_disposable.trusted_context
 WHERE principal=o.principal AND operation_id=o.operation_id FOR UPDATE;
 SELECT * INTO r FROM geoapify_disposable.reservation WHERE reservation_id=o.reservation_id FOR UPDATE;
 IF ctx.principal IS NULL OR ctx.revision IS DISTINCT FROM o.context_revision
 OR ctx.digest IS DISTINCT FROM o.context_digest OR r.reservation_id IS NULL
 OR r.principal IS DISTINCT FROM o.principal OR r.operation_id IS DISTINCT FROM o.operation_id
 OR r.payload_hash IS DISTINCT FROM o.context_digest OR r.lifecycle IS DISTINCT FROM 'DISPATCHED' THEN
  UPDATE geoapify_disposable.dispatch_outbox SET state='QUARANTINED'
  WHERE reservation_id=p_reservation_id;
  RETURN QUERY SELECT false,'QUARANTINED'::text,'CONTEXT_STALE_QUARANTINED'::text; RETURN;
 END IF;
 INSERT INTO geoapify_disposable.context_freeze_audit(
  reservation_id,principal,operation_id,frozen_revision,frozen_digest)
 VALUES(o.reservation_id,o.principal,o.operation_id,o.context_revision,o.context_digest);
 UPDATE geoapify_disposable.dispatch_outbox SET state='SEND_AUTHORIZED',
 send_authorized_at=clock_timestamp() WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,'SEND_AUTHORIZED'::text,'APPLIED'::text;
END $$;
-- Reject ALL context mutations while SEND_AUTHORIZED or UNKNOWN, even a no-op.
-- Freeze is released only after terminal reconciliation. Never silently unfreeze on timeout.
CREATE OR REPLACE FUNCTION geoapify_disposable.set_trusted_context(
 p_principal text,p_operation_id text,p_revision bigint,p_digest text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE old_context geoapify_disposable.trusted_context%ROWTYPE;
DECLARE frozen geoapify_disposable.context_freeze_audit%ROWTYPE;
BEGIN
 IF p_principal IS NULL OR p_operation_id IS NULL OR p_revision IS NULL OR p_revision<0
 OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid context'; END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO frozen FROM geoapify_disposable.context_freeze_audit
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF FOUND AND frozen.released_at IS NULL THEN
  RAISE EXCEPTION 'context frozen until terminal reconciliation';
 END IF;
 SELECT * INTO old_context FROM geoapify_disposable.trusted_context
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF FOUND THEN
  IF p_revision<old_context.revision OR (p_revision=old_context.revision AND p_digest<>old_context.digest)
  THEN RAISE EXCEPTION 'stale or conflicting context revision'; END IF;
  IF p_revision=old_context.revision THEN RETURN; END IF;
  UPDATE geoapify_disposable.trusted_context SET revision=p_revision,digest=p_digest,
   updated_at=clock_timestamp() WHERE principal=p_principal AND operation_id=p_operation_id;
 ELSE
  INSERT INTO geoapify_disposable.trusted_context(principal,operation_id,revision,digest)
  VALUES(p_principal,p_operation_id,p_revision,p_digest);
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state='QUARANTINED'
 WHERE principal=p_principal AND operation_id=p_operation_id AND state IN ('READY','CLAIMED');
END $$;
-- Wrap the previous terminal logic: finalize and release freeze in one transaction.
-- This replacement preserves the one-shot event token and refuses premature completion.
CREATE OR REPLACE FUNCTION geoapify_disposable.finish_dispatch(
 p_reservation_id uuid,p_claim_token text,p_outcome text
) RETURNS TABLE(applied boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE; DECLARE t record;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}$'
 OR p_outcome IS NULL OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED','UNKNOWN') THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND_OR_TOKEN_MISMATCH'::text; RETURN;
 END IF;
 IF o.state=p_outcome THEN RETURN QUERY SELECT false,o.state,'REPLAY'::text; RETURN; END IF;
 IF NOT (o.state='SEND_AUTHORIZED' OR (o.state='UNKNOWN' AND p_outcome IN ('SUCCEEDED','FAILED_CHARGED'))) THEN
  RETURN QUERY SELECT false,o.state,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 IF p_outcome IN ('SUCCEEDED','FAILED_CHARGED') THEN
  SELECT * INTO t FROM geoapify_disposable.transition(o.principal,o.operation_id,o.context_digest,
   'outbox-'||p_claim_token,CASE WHEN p_outcome='SUCCEEDED' THEN 'CONSUMED' ELSE 'FAILED_CHARGED' END);
  IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
   RETURN QUERY SELECT false,o.state,'LEDGER_REJECTED'::text; RETURN;
  END IF;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state=p_outcome,
 finalized_at=CASE WHEN p_outcome='UNKNOWN' THEN NULL ELSE clock_timestamp() END
 WHERE reservation_id=p_reservation_id;
 IF p_outcome IN ('SUCCEEDED','FAILED_CHARGED') THEN
  UPDATE geoapify_disposable.context_freeze_audit SET released_at=clock_timestamp()
  WHERE reservation_id=p_reservation_id AND released_at IS NULL;
 END IF;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_send_once(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.set_trusted_context(text,text,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.finish_dispatch(uuid,text,text) FROM PUBLIC;
COMMIT;
