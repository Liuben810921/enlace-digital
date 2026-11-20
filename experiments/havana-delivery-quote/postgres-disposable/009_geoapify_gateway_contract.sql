-- Disposable local PostgreSQL only. Apply AFTER 001,003,005,007.
-- Digest is the exact 64-character SHA-256 computed by dispatch-contract.mjs.
BEGIN;
-- The existing payload_hash column stores the canonical context digest.
-- reserve() already compares it on replay; this wrapper exposes the contract
-- without changing its legacy SQL callers.
CREATE OR REPLACE FUNCTION geoapify_disposable.reserve_contract(
 p_principal text,p_operation_id text,p_context_digest text,p_credits integer,p_day date
) RETURNS TABLE(committed boolean,reservation_id uuid,reason text,lifecycle text,context_digest text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE v record;
BEGIN
 IF p_context_digest IS NULL OR p_context_digest !~ '^[0-9a-f]{64}$' THEN
  RETURN QUERY SELECT false,NULL::uuid,'INVALID_DIGEST'::text,NULL::text,NULL::text; RETURN;
 END IF;
 SELECT * INTO v FROM geoapify_disposable.reserve(p_principal,p_operation_id,p_context_digest,p_credits,p_day);
 IF NOT FOUND THEN RAISE EXCEPTION 'reserve returned no row'; END IF;
 RETURN QUERY SELECT v.committed,v.reservation_id,v.reason,
  CASE WHEN v.committed AND v.reason IN ('RESERVED','REPLAY_RESERVED') THEN 'RESERVED'::text ELSE NULL::text END,
  CASE WHEN v.committed THEN p_context_digest ELSE NULL::text END;
END $$;

-- Strict one-time dispatch. No token replay may grant a second authorization.
-- The row is locked by transition() and its advisory lock serializes dispatches.
CREATE OR REPLACE FUNCTION geoapify_disposable.authorize_dispatch_contract(
 p_principal text,p_operation_id text,p_context_digest text,p_reservation_id uuid,
 p_context_revision bigint,p_event_token text
) RETURNS TABLE(authorized boolean,lifecycle text,reason text,reservation_id uuid,operation_id text,context_revision bigint,context_digest text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE r geoapify_disposable.reservation%ROWTYPE;
DECLARE t record;
BEGIN
 IF p_context_digest IS NULL OR p_context_digest !~ '^[0-9a-f]{64}$'
 OR p_reservation_id IS NULL OR p_context_revision IS NULL OR p_context_revision<0
 OR p_event_token IS NULL OR p_event_token !~ '^[A-Za-z0-9_-]{12,80}$' THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO r FROM geoapify_disposable.reservation
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF NOT FOUND OR r.reservation_id<>p_reservation_id OR r.payload_hash<>p_context_digest OR r.lifecycle<>'RESERVED' THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_DISPATCHABLE'::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 SELECT * INTO t FROM geoapify_disposable.transition(p_principal,p_operation_id,p_context_digest,p_event_token,'DISPATCHED');
 IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
  RETURN QUERY SELECT false,NULL::text,coalesce(t.reason,'DENIED')::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 RETURN QUERY SELECT true,'DISPATCHED'::text,'APPLIED'::text,p_reservation_id,p_operation_id,p_context_revision,p_context_digest;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.reserve_contract(text,text,text,integer,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_dispatch_contract(text,text,text,uuid,bigint,text) FROM PUBLIC;
COMMIT;
