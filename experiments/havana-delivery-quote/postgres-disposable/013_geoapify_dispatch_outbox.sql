-- Disposable PostgreSQL ONLY. Apply after 011. No provider transport.
BEGIN;
CREATE TABLE geoapify_disposable.dispatch_outbox (
 reservation_id uuid PRIMARY KEY REFERENCES geoapify_disposable.reservation(reservation_id),
 principal text NOT NULL, operation_id text NOT NULL,
 context_digest text NOT NULL CHECK(context_digest ~ '^[0-9a-f]{64}$'),
 context_revision bigint NOT NULL CHECK(context_revision>=0),
 state text NOT NULL DEFAULT 'READY' CHECK(state IN ('READY','CLAIMED','SUCCEEDED','FAILED_CHARGED','UNKNOWN')),
 claim_token text UNIQUE,
 claimed_at timestamptz,
 finalized_at timestamptz,
 UNIQUE(principal,operation_id)
);
REVOKE ALL ON geoapify_disposable.dispatch_outbox FROM PUBLIC;
-- Atomic dispatch + durable outbox insertion. Uses same advisory lock as context writer.
CREATE OR REPLACE FUNCTION geoapify_disposable.authorize_dispatch_contract(
 p_principal text,p_operation_id text,p_context_digest text,p_reservation_id uuid,
 p_context_revision bigint,p_event_token text
) RETURNS TABLE(authorized boolean,lifecycle text,reason text,reservation_id uuid,operation_id text,context_revision bigint,context_digest text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE r geoapify_disposable.reservation%ROWTYPE; DECLARE t record;
DECLARE ctx geoapify_disposable.trusted_context%ROWTYPE;
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
 INSERT INTO geoapify_disposable.dispatch_outbox(reservation_id,principal,operation_id,context_digest,context_revision)
 VALUES(p_reservation_id,p_principal,p_operation_id,p_context_digest,p_context_revision);
 RETURN QUERY SELECT true,'DISPATCHED'::text,'APPLIED'::text,p_reservation_id,p_operation_id,ctx.revision,ctx.digest;
END $$;
-- A worker may claim READY only once. CLAIMED is never automatically retried.
-- An ambiguous network outcome is marked UNKNOWN and requires reconciliation.
CREATE OR REPLACE FUNCTION geoapify_disposable.claim_dispatch(p_reservation_id uuid,p_claim_token text)
RETURNS TABLE(claimed boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73} THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND THEN RETURN QUERY SELECT false,NULL::text,'NOT_FOUND'::text; RETURN; END IF;
 IF o.state<>'READY' THEN
  RETURN QUERY SELECT false,o.state,'ALREADY_CLAIMED_OR_FINAL'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state='CLAIMED',claim_token=p_claim_token,claimed_at=clock_timestamp()
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,'CLAIMED'::text,'CLAIMED'::text;
END $$;
CREATE OR REPLACE FUNCTION geoapify_disposable.finish_dispatch(
 p_reservation_id uuid,p_claim_token text,p_outcome text
) RETURNS TABLE(applied boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE; DECLARE t record;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}
 OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED','UNKNOWN') THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND_OR_TOKEN_MISMATCH'::text; RETURN;
 END IF;
 IF o.state=p_outcome THEN
  RETURN QUERY SELECT false,o.state,'REPLAY'::text; RETURN;
 END IF;
 IF NOT (o.state='CLAIMED' OR (o.state='UNKNOWN' AND p_outcome IN ('SUCCEEDED','FAILED_CHARGED'))) THEN
  RETURN QUERY SELECT false,o.state,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 IF p_outcome IN ('SUCCEEDED','FAILED_CHARGED') THEN
  SELECT * INTO t FROM geoapify_disposable.transition(o.principal,o.operation_id,o.context_digest,
   ('outbox-'||p_claim_token),CASE WHEN p_outcome='SUCCEEDED' THEN 'CONSUMED' ELSE 'FAILED_CHARGED' END);
  IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
   RETURN QUERY SELECT false,o.state,'LEDGER_REJECTED'::text; RETURN;
  END IF;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state=p_outcome,
  finalized_at=CASE WHEN p_outcome='UNKNOWN' THEN NULL ELSE clock_timestamp() END
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_dispatch_contract(text,text,text,uuid,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.claim_dispatch(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.finish_dispatch(uuid,text,text) FROM PUBLIC;
COMMIT;
 OR p_outcome IS NULL
 OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED','UNKNOWN') THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND_OR_TOKEN_MISMATCH'::text; RETURN;
 END IF;
 IF o.state=p_outcome THEN
  RETURN QUERY SELECT false,o.state,'REPLAY'::text; RETURN;
 END IF;
 IF NOT (o.state='CLAIMED' OR (o.state='UNKNOWN' AND p_outcome IN ('SUCCEEDED','FAILED_CHARGED'))) THEN
  RETURN QUERY SELECT false,o.state,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 IF p_outcome IN ('SUCCEEDED','FAILED_CHARGED') THEN
  SELECT * INTO t FROM geoapify_disposable.transition(o.principal,o.operation_id,o.context_digest,
   ('outbox-'||p_claim_token),CASE WHEN p_outcome='SUCCEEDED' THEN 'CONSUMED' ELSE 'FAILED_CHARGED' END);
  IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
   RETURN QUERY SELECT false,o.state,'LEDGER_REJECTED'::text; RETURN;
  END IF;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state=p_outcome,
  finalized_at=CASE WHEN p_outcome='UNKNOWN' THEN NULL ELSE clock_timestamp() END
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_dispatch_contract(text,text,text,uuid,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.claim_dispatch(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.finish_dispatch(uuid,text,text) FROM PUBLIC;
COMMIT;
 THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND THEN RETURN QUERY SELECT false,NULL::text,'NOT_FOUND'::text; RETURN; END IF;
 IF o.state<>'READY' THEN
  RETURN QUERY SELECT false,o.state,'ALREADY_CLAIMED_OR_FINAL'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state='CLAIMED',claim_token=p_claim_token,claimed_at=clock_timestamp()
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,'CLAIMED'::text,'CLAIMED'::text;
END $$;
CREATE OR REPLACE FUNCTION geoapify_disposable.finish_dispatch(
 p_reservation_id uuid,p_claim_token text,p_outcome text
) RETURNS TABLE(applied boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE; DECLARE t record;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}
 OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED','UNKNOWN') THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND_OR_TOKEN_MISMATCH'::text; RETURN;
 END IF;
 IF o.state=p_outcome THEN
  RETURN QUERY SELECT false,o.state,'REPLAY'::text; RETURN;
 END IF;
 IF NOT (o.state='CLAIMED' OR (o.state='UNKNOWN' AND p_outcome IN ('SUCCEEDED','FAILED_CHARGED'))) THEN
  RETURN QUERY SELECT false,o.state,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 IF p_outcome IN ('SUCCEEDED','FAILED_CHARGED') THEN
  SELECT * INTO t FROM geoapify_disposable.transition(o.principal,o.operation_id,o.context_digest,
   ('outbox-'||p_claim_token),CASE WHEN p_outcome='SUCCEEDED' THEN 'CONSUMED' ELSE 'FAILED_CHARGED' END);
  IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
   RETURN QUERY SELECT false,o.state,'LEDGER_REJECTED'::text; RETURN;
  END IF;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state=p_outcome,
  finalized_at=CASE WHEN p_outcome='UNKNOWN' THEN NULL ELSE clock_timestamp() END
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_dispatch_contract(text,text,text,uuid,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.claim_dispatch(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.finish_dispatch(uuid,text,text) FROM PUBLIC;
COMMIT;
 OR p_outcome IS NULL
 OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED','UNKNOWN') THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,NULL::text,'NOT_FOUND_OR_TOKEN_MISMATCH'::text; RETURN;
 END IF;
 IF o.state=p_outcome THEN
  RETURN QUERY SELECT false,o.state,'REPLAY'::text; RETURN;
 END IF;
 IF NOT (o.state='CLAIMED' OR (o.state='UNKNOWN' AND p_outcome IN ('SUCCEEDED','FAILED_CHARGED'))) THEN
  RETURN QUERY SELECT false,o.state,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 IF p_outcome IN ('SUCCEEDED','FAILED_CHARGED') THEN
  SELECT * INTO t FROM geoapify_disposable.transition(o.principal,o.operation_id,o.context_digest,
   ('outbox-'||p_claim_token),CASE WHEN p_outcome='SUCCEEDED' THEN 'CONSUMED' ELSE 'FAILED_CHARGED' END);
  IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
   RETURN QUERY SELECT false,o.state,'LEDGER_REJECTED'::text; RETURN;
  END IF;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state=p_outcome,
  finalized_at=CASE WHEN p_outcome='UNKNOWN' THEN NULL ELSE clock_timestamp() END
 WHERE reservation_id=p_reservation_id;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.authorize_dispatch_contract(text,text,text,uuid,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.claim_dispatch(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.finish_dispatch(uuid,text,text) FROM PUBLIC;
COMMIT;
