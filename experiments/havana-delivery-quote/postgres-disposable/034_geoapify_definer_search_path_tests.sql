-- Disposable-only, rollback-only; no reviewer activation.
BEGIN;
DO $$
DECLARE failed record; DECLARE n integer;
BEGIN
 FOR failed IN SELECT * FROM geoapify_disposable.inspect_session_identity_contract()
 WHERE safe IS DISTINCT FROM true LOOP
  RAISE EXCEPTION 'identity contract failed: %',failed.check_name;
 END LOOP;
 SELECT count(*) INTO n FROM pg_catalog.pg_proc p
 WHERE p.oid IN (
 'geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)'::regprocedure,
 'geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)'::regprocedure)
 AND p.prosecdef
 AND EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg
  WHERE cfg='search_path=pg_catalog,geoapify_disposable,pg_temp');
 IF n<>2 THEN RAISE EXCEPTION 'pg_temp not last'; END IF;
 RAISE NOTICE 'PASS catalog path, executor membership and ownership assertions';
END $$;
ROLLBACK;
-- PENDING TWO-SESSION ADVERSARIAL TESTS (not executed):
-- SET ROLE into a reviewer must never count as a separate login identity.
-- session_user under SECURITY DEFINER must be bound to authenticated connection.
-- Reviewer login cannot inherit executor or own sensitive tables.
-- Temp table/function shadowing must not affect fully qualified references.
-- Two reviewers with conflicting evidence or revoked membership must fail closed.
-- Concurrent finalizations and unknown commit acknowledgement must not resend.
