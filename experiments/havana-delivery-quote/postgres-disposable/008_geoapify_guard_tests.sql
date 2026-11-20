-- Disposable PostgreSQL ONLY. Run after 001,003,005,007. Rollback all changes.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('a',64);
DECLARE r record; DECLARE t record; DECLARE old_spent integer; DECLARE new_spent integer;
BEGIN
 SELECT * INTO r FROM geoapify_disposable.reserve('guard-tester','operation-guard-0001',h,2,d);
 IF NOT r.committed OR r.reason<>'RESERVED' THEN RAISE EXCEPTION 'reserve'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('guard-tester','operation-guard-0001',h,'event-release-guard1','RELEASED');
 IF NOT t.applied THEN RAISE EXCEPTION 'release'; END IF;
 SELECT spent INTO old_spent FROM geoapify_disposable.budget WHERE day_utc=d;
 SELECT * INTO r FROM geoapify_disposable.reserve('guard-tester','operation-guard-0001',h,2,d);
 IF r.committed OR r.reason<>'RESERVATION_RELEASED' THEN RAISE EXCEPTION 'unsafe replay after release: %',r.reason; END IF;
 SELECT spent INTO new_spent FROM geoapify_disposable.budget WHERE day_utc=d;
 IF old_spent<>new_spent THEN RAISE EXCEPTION 'replay debited credits'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('guard-tester','operation-guard-0001',h,'event-dispatch-guard1','DISPATCHED');
 IF t.applied THEN RAISE EXCEPTION 'dispatch after release'; END IF;
 SELECT * INTO r FROM geoapify_disposable.reserve('guard-tester','operation-guard-0002',h,1,d);
 UPDATE geoapify_disposable.reservation SET created_at=clock_timestamp()-interval '10 minutes'
 WHERE principal='guard-tester' AND operation_id='operation-guard-0002';
 SELECT * INTO t FROM geoapify_disposable.transition('guard-tester','operation-guard-0002',h,'event-dispatch-guard2','DISPATCHED');
 IF t.applied OR t.reason<>'RESERVATION_EXPIRED' THEN RAISE EXCEPTION 'expired dispatch'; END IF;
 PERFORM geoapify_disposable.mark_orphans(interval '5 minutes');
 SELECT * INTO r FROM geoapify_disposable.reserve('guard-tester','operation-guard-0002',h,1,d);
 IF r.committed OR r.reason<>'RESERVATION_REVIEW_REQUIRED' THEN RAISE EXCEPTION 'orphan replay'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('guard-tester','operation-guard-0002',h,'event-release-guard2','RELEASED');
 IF t.applied THEN RAISE EXCEPTION 'unsafe orphan refund'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('guard-tester','operation-guard-0002',h,'event-charge-guard2','FAILED_CHARGED');
 IF NOT t.applied THEN RAISE EXCEPTION 'orphan reconciliation'; END IF;
 SELECT * INTO r FROM geoapify_disposable.reserve('guard-tester','operation-guard-0002',h,1,d);
 IF r.committed OR r.reason<>'RESERVATION_FAILED_CHARGED' THEN RAISE EXCEPTION 'terminal replay'; END IF;
 RAISE NOTICE 'PASS released replay / no double debit / expired dispatch / orphan quarantine / no refund / terminal replay';
END $$;
ROLLBACK;
