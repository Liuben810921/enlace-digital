-- Disposable-only: catalog assertions plus negative cases. No role creation or grants.
BEGIN;
DO $$
DECLARE fn text; DECLARE n integer;
BEGIN
 SELECT pg_get_functiondef('geoapify_disposable.record_reconciliation_evidence(uuid,text,text,text,text)'::regprocedure) INTO fn;
 IF position('current_user<>session_user' IN fn)=0 THEN RAISE EXCEPTION 'record permits SET ROLE impersonation'; END IF;
 SELECT pg_get_functiondef('geoapify_disposable.reconcile_dispatch(uuid,text,text,text,text)'::regprocedure) INTO fn;
 IF position('current_user<>session_user' IN fn)=0 THEN RAISE EXCEPTION 'reconcile permits SET ROLE impersonation'; END IF;
 IF position('REVIEWER_REVOKED' IN fn)=0 THEN RAISE EXCEPTION 'revoked reviewer can count'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.reconciliation_reviewer;
 IF n<>0 THEN RAISE EXCEPTION 'reviewer allowlist unexpectedly populated'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.reconciliation_evidence;
 IF n<>0 THEN RAISE EXCEPTION 'evidence unexpectedly populated'; END IF;
 IF has_table_privilege('public','geoapify_disposable.reconciliation_evidence','INSERT') THEN
  RAISE EXCEPTION 'PUBLIC may inject evidence'; END IF;
 IF has_table_privilege('public','geoapify_disposable.reconciliation_reviewer','INSERT') THEN
  RAISE EXCEPTION 'PUBLIC may enroll reviewer'; END IF;
 RAISE NOTICE 'PASS identity guards, empty allowlist, empty evidence, no PUBLIC inserts';
END $$;
ROLLBACK;
-- TWO-SESSION MANUAL TEST PLAN (not executed):
-- Create two separate LOGIN identities with independent credentials in a disposable DB.
-- Give each narrowly scoped EXECUTE + required table access; never GRANT direct INSERT to evidence.
-- Session A attests digest X and reference R; one attestation cannot reconcile.
-- Session B attests same X/R; reconcile succeeds exactly once and unfreezes.
-- Session B attests conflicting Y/R on another reservation; conflict must block terminal state.
-- Revoke B from reviewer allowlist after attestation; reconciliation must fail.
-- A single login SET ROLE B must be rejected by current_user<>session_user.
-- Hold advisory lock in A; B waits, then observes committed state; on unknown COMMIT ACK never re-send.
