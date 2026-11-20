-- DISPOSABLE ONLY. Structural/catalog assertions, not a live two-login test.
BEGIN;
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM pg_catalog.pg_roles
 WHERE rolname='ed_reconcile_executor' AND rolcanlogin=false
 AND rolsuper=false AND rolbypassrls=false AND rolcreatedb=false AND rolcreaterole=false;
 IF n<>1 THEN RAISE EXCEPTION 'unsafe executor role attributes'; END IF;
 SELECT count(*) INTO n FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_roles r ON r.oid=p.proowner
 WHERE p.oid IN (
 'geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)'::regprocedure,
 'geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)'::regprocedure)
 AND p.prosecdef=true AND r.rolname='ed_reconcile_executor';
 IF n<>2 THEN RAISE EXCEPTION 'wrong definer ownership'; END IF;
 IF has_schema_privilege('ed_reconcile_executor','geoapify_disposable','CREATE') THEN
  RAISE EXCEPTION 'executor retains schema CREATE'; END IF;
 IF has_table_privilege('ed_reconcile_executor','geoapify_disposable.reconciliation_reviewer','INSERT')
 OR has_table_privilege('ed_reconcile_executor','geoapify_disposable.trusted_context','UPDATE')
 OR has_table_privilege('ed_reconcile_executor','geoapify_disposable.dispatch_outbox','DELETE') THEN
  RAISE EXCEPTION 'executor overprivileged'; END IF;
 SELECT count(*) INTO n FROM pg_catalog.pg_proc p
 CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
 WHERE p.oid IN (
 'geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)'::regprocedure,
 'geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)'::regprocedure)
 AND a.grantee=0 AND a.privilege_type='EXECUTE';
 IF n<>0 THEN RAISE EXCEPTION 'public wrapper execution'; END IF;
 RAISE NOTICE 'PASS no-login definer, no bypassrls, disabled wrappers, minimum privilege assertions';
END $$;
ROLLBACK;
-- UNEXECUTED ADVERSARIAL MATRIX:
-- Two distinct LOGIN reviewers; no direct table DML and no inherited executor membership.
-- Attempt SET ROLE ed_reconcile_executor must fail for reviewers.
-- Attest/reconcile wrappers must be non-executable until separate authorization.
-- After independent review of future enabled functions: matching two identities,
-- mismatched evidence, revocation between signatures, concurrent reconciliation,
-- unknown commit ACK, and replay must preserve one terminal transition.
