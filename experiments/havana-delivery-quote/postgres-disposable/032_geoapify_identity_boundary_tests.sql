-- DISPOSABLE PostgreSQL only; apply after 031; rollback-only.
BEGIN;
DO $$
DECLARE bad record; DECLARE n integer;
BEGIN
 FOR bad IN SELECT * FROM geoapify_disposable.inspect_reconciliation_identity_boundary()
  WHERE safe IS DISTINCT FROM true LOOP
  RAISE EXCEPTION 'unsafe identity boundary: % (%)',bad.check_name,bad.detail;
 END LOOP;
 SELECT count(*) INTO n FROM pg_catalog.pg_proc p
 WHERE p.oid IN (
  'geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)'::regprocedure,
  'geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)'::regprocedure)
 AND p.prosecdef AND p.proconfig::text LIKE '%search_path%';
 IF n<>2 THEN RAISE EXCEPTION 'wrapper definer or search_path configuration invalid'; END IF;
 RAISE NOTICE 'PASS identity boundary catalog checks (not two-login execution)';
END $$;
ROLLBACK;
-- UNEXECUTED TWO-SESSION ADVERSARIAL CASES:
-- A/B independent LOGIN roles; neither can SET ROLE executor, directly or indirectly.
-- Attempt GRANT executor to A through an intermediary role: diagnostics must fail.
-- Attempt CREATE temp object with function/table name: definer must use pg_temp last.
-- Attempt ownership transfer of sensitive table to executor without FORCE RLS: fail.
-- Attempt B signature after revocation: terminal reconciliation remains frozen.
-- A and B conflicting evidence: never reconcile; concurrent signatures serialized.
-- Lost COMMIT ACK: read durable state; never reauthorize/send automatically.
-- The two disabled wrappers must continue to return DENY and have no reviewer grants.
