-- Disposable PostgreSQL only. Apply after 009. No production use.
BEGIN;
CREATE TABLE geoapify_disposable.trusted_context (
 principal text NOT NULL,
 operation_id text NOT NULL,
 revision bigint NOT NULL CHECK(revision>=0),
 digest text NOT NULL CHECK(digest ~ '^[0-9a-f]{64}$'),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(principal,operation_id)
);
REVOKE ALL ON geoapify_disposable.trusted_context FROM PUBLIC;
-- Trusted writer must derive digest from authoritative context; not client input.
CREATE OR REPLACE FUNCTION geoapify_disposable.set_trusted_context(
 p_principal text,p_operation_id text,p_revision bigint,p_digest text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
BEGIN
 IF p_principal IS NULL OR p_operation_id IS NULL OR p_revision IS NULL OR p_revision<0
 OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid context'; END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 INSERT INTO geoapify_disposable.trusted_context(principal,operation_id,revision,digest)
 VALUES(p_principal,p_operation_id,p_revision,p_digest)
 ON CONFLICT(principal,operation_id) DO UPDATE
 SET revision=EXCLUDED.revision,digest=EXCLUDED.digest,updated_at=clock_timestamp()
 WHERE geoapify_disposable.trusted_context.revision<=EXCLUDED.revision;
 IF NOT FOUND THEN RAISE EXCEPTION 'stale context revision'; END IF;
END $$;
-- Dispatch and context mutation use the SAME transaction-scoped advisory lock.
CREATE OR REPLACE FUNCTION geoapify_disposable.authorize_dispatch_contract(
 p_principal text,p_operation_id text,p_context_digest text,p_reservation_id uuid,
 p_context_revision bigint,p_event_token text
) RETURNS TABLE(authorized boolean,lifecycle text,reason text,reservation_id uuid,operation_id text,context_revision bigint,context_digest text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE r geoapify_disposable.reservation%ROWTYPE;
DECLARE t record; DECLARE ctx geoapify_disposable.trusted_context%ROWTYPE;
BEGIN
 IF p_context_digest IS NULL OR p_context_digest !~ '^[0-9a-f]{64}$'
 OR p_reservation_id IS NULL OR p_context_revision IS NULL OR p_context_revision<0
 OR p_event_token IS NULL OR p_event_token !~ '^[A-Za-z0-9_-]{12,80}$' THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO ctx FROM geoapify_disposable.trusted_context
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF NOT FOUND OR ctx.revision<>p_context_revision OR ctx.digest<>p_context_digest THEN
  RETURN QUERY SELECT false,NULL::text,'CONTEXT_NOT_CURRENT'::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 SELECT * INTO r FROM geoapify_disposable.reservation
 WHERE principal=p_principal AND operation_id=p_operation_id FOR UPDATE;
 IF NOT FOUND OR r.reservation_id<>p_reservation_id OR r.payload_hash<>ctx.digest OR r.lifecycle<>'RESERVED' THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_DISPATCHABLE'::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 SELECT * INTO t FROM geoapify_disposable.transition(p_principal,p_operation_id,p_context_digest,p_event_token,'DISPATCHED');
 IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
  RETURN QUERY SELECT false,NULL::text,coalesce(t.reason,'DENIED')::text,NULL::uuid,NULL::text,NULL::bigint,NULL::text; RETURN;
 END IF;
 RETURN QUERY SELECT true,'DISPATCHED'::text,'APPLIED'::text,p_reservation_id,p_operation_id,ctx.revision,ctx.digest;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.set_trusted_context(text,text,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_dispatch_contract(text,text,text,uuid,bigint,text) FROM PUBLIC;
COMMIT;
