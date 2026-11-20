-- Disposable local PostgreSQL only. Apply 001,003,005 before this file.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('f',64);
DECLARE r record; DECLARE t record; DECLARE before_spent integer; DECLARE after_spent integer;
BEGIN
 SELECT * INTO r FROM geoapify_disposable.reserve('lifecycle-tester','operation-life-0001',h,2,d);
 IF NOT r.committed OR r.reason<>'RESERVED' THEN RAISE EXCEPTION 'reservation'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0001',h,'event-dispatch-0001','DISPATCHED');
 IF NOT t.applied OR t.lifecycle<>'DISPATCHED' THEN RAISE EXCEPTION 'dispatch'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0001',h,'event-dispatch-0001','DISPATCHED');
 IF NOT t.applied OR t.reason<>'REPLAY' THEN RAISE EXCEPTION 'dispatch replay'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0001',h,'event-dispatch-0001','RELEASED');
 IF t.applied OR t.reason<>'EVENT_CONFLICT' THEN RAISE EXCEPTION 'event token conflict'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0001',h,'event-release-0001','RELEASED');
 IF t.applied THEN RAISE EXCEPTION 'unsafe refund after dispatch'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0001',h,'event-consumed-0001','CONSUMED');
 IF NOT t.applied OR t.lifecycle<>'CONSUMED' THEN RAISE EXCEPTION 'consumption'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0001',h,'event-failed-0001','FAILED_CHARGED');
 IF t.applied THEN RAISE EXCEPTION 'terminal state changed'; END IF;
 SELECT * INTO r FROM geoapify_disposable.reserve('lifecycle-tester','operation-life-0002',h,3,d);
 SELECT spent INTO before_spent FROM geoapify_disposable.budget WHERE day_utc=d;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0002',h,'event-release-0002','RELEASED');
 IF NOT t.applied THEN RAISE EXCEPTION 'pre-dispatch release'; END IF;
 SELECT spent INTO after_spent FROM geoapify_disposable.budget WHERE day_utc=d;
 IF after_spent<>before_spent-3 THEN RAISE EXCEPTION 'refund mismatch'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0002',h,'event-release-0002','RELEASED');
 IF NOT t.applied OR t.reason<>'REPLAY' THEN RAISE EXCEPTION 'release replay'; END IF;
 SELECT * INTO t FROM geoapify_disposable.transition('lifecycle-tester','operation-life-0002',h,'event-dispatch-0002','DISPATCHED');
 IF t.applied THEN RAISE EXCEPTION 'released reservation dispatched'; END IF;
 RAISE NOTICE 'PASS lifecycle, replay, conflict, no refund after dispatch, terminal, refund once';
END $$;
ROLLBACK;
