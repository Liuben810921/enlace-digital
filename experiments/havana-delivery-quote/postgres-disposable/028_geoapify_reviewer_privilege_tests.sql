-- Disposable PostgreSQL only, after 027. Rollback-only.
BEGIN;
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM geoapify_disposable.reconciliation_privilege_policy
 WHERE policy_id=1 AND enabled=false AND owner_role IS NULL;
 IF n<>1 THEN RAISE EXCEPTION 'unsafe default privilege policy'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.inspect_reviewer_table_access();
 IF n<>0 THEN RAISE EXCEPTION 'reviewer direct DML privilege found'; END IF;
 SELECT count(*) INTO n FROM pg_catalog.pg_proc WHERE oid IN (
  'geoapify_disposable.record_reconciliation_evidence(uuid,text,text,text,text)'::regprocedure,
  'geoapify_disposable.reconcile_dispatch(uuid,text,text,text,text)'::regprocedure)
  AND prosecdef=false;
 IF n<>2 THEN RAISE EXCEPTION 'unexpected reviewer function security mode'; END IF;
 RAISE NOTICE 'PASS default-deny policy, no reviewer direct DML, invoker functions not activated';
END $$;
ROLLBACK;
-- MANUAL DISPOSABLE TWO-LOGIN MATRIX (NOT EXECUTED):
-- Reviewer A and reviewer B must have independent LOGIN roles.
-- With no direct table grants, SECURITY INVOKER evidence functions should fail
-- for lack of table access. This is intentional; DO NOT fix by granting DML.
-- A separate, audited NOLOGIN SECURITY DEFINER executor with minimum
-- table privileges and no BYPASSRLS is required before any positive path.
-- With such an executor: verify A+B matching evidence, mismatched digests,
-- revocation after signing, concurrent finalizations, and lost COMMIT ACK.
