-- Disposable-only: reject SET ROLE impersonation; revoke invalidated reviewers.
BEGIN;
CREATE OR REPLACE FUNCTION geoapify_disposable.record_reconciliation_evidence(
 p_reservation_id uuid,p_claim_token text,p_outcome text,
 p_evidence_digest text,p_external_reference text
) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}$'
 OR p_outcome IS NULL OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED')
 OR p_evidence_digest IS NULL OR p_evidence_digest !~ '^[0-9a-f]{64}$'
 OR p_external_reference IS NULL OR length(p_external_reference) NOT BETWEEN 12 AND 160 THEN
  RETURN false;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 IF current_user<>session_user OR NOT EXISTS (SELECT 1 FROM geoapify_disposable.reconciliation_reviewer WHERE db_role=current_user) THEN
  RETURN false;
 END IF;
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token
 OR o.state NOT IN ('SEND_AUTHORIZED','UNKNOWN') THEN RETURN false; END IF;
 INSERT INTO geoapify_disposable.reconciliation_evidence(
  reservation_id,reviewer,claim_token,outcome,evidence_digest,external_reference)
 VALUES(p_reservation_id,current_user,p_claim_token,p_outcome,p_evidence_digest,p_external_reference)
 ON CONFLICT DO NOTHING;
 RETURN FOUND;
END $$;
-- Two distinct authorized database identities must attest identical evidence and outcome.
CREATE OR REPLACE FUNCTION geoapify_disposable.reconcile_dispatch(
 p_reservation_id uuid,p_claim_token text,p_outcome text,
 p_evidence_digest text,p_external_reference text
) RETURNS TABLE(applied boolean,state text,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE o geoapify_disposable.dispatch_outbox%ROWTYPE; DECLARE t record; DECLARE n integer;
BEGIN
 IF p_reservation_id IS NULL OR p_claim_token IS NULL OR p_claim_token !~ '^[A-Za-z0-9_-]{12,73}$'
 OR p_outcome IS NULL OR p_outcome NOT IN ('SUCCEEDED','FAILED_CHARGED')
 OR p_evidence_digest IS NULL OR p_evidence_digest !~ '^[0-9a-f]{64}$'
 OR p_external_reference IS NULL OR length(p_external_reference) NOT BETWEEN 12 AND 160 THEN
  RETURN QUERY SELECT false,NULL::text,'INVALID_INPUT'::text; RETURN;
 END IF;
 PERFORM pg_advisory_xact_lock(7342291,1);
 IF current_user<>session_user OR NOT EXISTS (SELECT 1 FROM geoapify_disposable.reconciliation_reviewer WHERE db_role=current_user) THEN
  RETURN QUERY SELECT false,NULL::text,'REVIEWER_NOT_AUTHORIZED'::text; RETURN;
 END IF;
 SELECT * INTO o FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=p_reservation_id FOR UPDATE;
 IF NOT FOUND OR o.claim_token IS DISTINCT FROM p_claim_token THEN
  RETURN QUERY SELECT false,NULL::text,'TOKEN_MISMATCH'::text; RETURN;
 END IF;
 IF o.state NOT IN ('SEND_AUTHORIZED','UNKNOWN') THEN
  RETURN QUERY SELECT false,o.state,'INVALID_TRANSITION'::text; RETURN;
 END IF;
 SELECT count(DISTINCT reviewer) INTO n FROM geoapify_disposable.reconciliation_evidence
 WHERE reservation_id=p_reservation_id AND claim_token=p_claim_token
 AND outcome=p_outcome AND evidence_digest=p_evidence_digest
 AND external_reference=p_external_reference;
 IF n<2 THEN RETURN QUERY SELECT false,o.state,'TWO_MATCHING_REVIEWS_REQUIRED'::text; RETURN; END IF;
 IF EXISTS (SELECT 1 FROM geoapify_disposable.reconciliation_evidence e
  WHERE e.reservation_id=p_reservation_id AND NOT EXISTS
  (SELECT 1 FROM geoapify_disposable.reconciliation_reviewer rr WHERE rr.db_role=e.reviewer)) THEN
  RETURN QUERY SELECT false,o.state,'REVIEWER_REVOKED'::text; RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM geoapify_disposable.reconciliation_evidence
  WHERE reservation_id=p_reservation_id AND (outcome<>p_outcome OR evidence_digest<>p_evidence_digest
  OR external_reference<>p_external_reference)) THEN
  RETURN QUERY SELECT false,o.state,'CONFLICTING_EVIDENCE'::text; RETURN;
 END IF;
 SELECT * INTO t FROM geoapify_disposable.transition(o.principal,o.operation_id,o.context_digest,
  'outbox-'||p_claim_token,CASE WHEN p_outcome='SUCCEEDED' THEN 'CONSUMED' ELSE 'FAILED_CHARGED' END);
 IF t.applied IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN
  RETURN QUERY SELECT false,o.state,'LEDGER_REJECTED'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.dispatch_outbox SET state=p_outcome,finalized_at=clock_timestamp()
 WHERE reservation_id=p_reservation_id;
 UPDATE geoapify_disposable.context_freeze_audit SET released_at=clock_timestamp()
 WHERE reservation_id=p_reservation_id AND released_at IS NULL;
 RETURN QUERY SELECT true,p_outcome,'APPLIED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.finish_dispatch(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.record_reconciliation_evidence(uuid,text,text,text,text) FROM PUBLIC;

REVOKE ALL ON FUNCTION geoapify_disposable.record_reconciliation_evidence(uuid,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.reconcile_dispatch(uuid,text,text,text,text) FROM PUBLIC;
COMMIT;
