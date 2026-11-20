-- Run ONLY after 001_geoapify_ledger.sql in a disposable local PostgreSQL.
-- Test transaction is rolled back. No external connections.
BEGIN;
DO $$
DECLARE d date := (now() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('a',64);
DECLARE x record; DECLARE y record; DECLARE z record; DECLARE spent_now integer;
BEGIN
 SELECT * INTO x FROM geoapify_disposable.reserve('tester','operation-00001',h,3,d);
 IF NOT x.committed OR x.reason<>'RESERVED' OR x.reservation_id IS NULL THEN RAISE EXCEPTION 'reserve failed'; END IF;
 SELECT * INTO y FROM geoapify_disposable.reserve('tester','operation-00001',h,3,d);
 IF NOT y.committed OR y.reason<>'REPLAY_RESERVED' OR y.reservation_id<>x.reservation_id THEN RAISE EXCEPTION 'idempotency replay failed'; END IF;
 SELECT * INTO z FROM geoapify_disposable.reserve('tester','operation-00001',repeat('b',64),3,d);
 IF z.committed OR z.reason<>'IDEMPOTENCY_CONFLICT' THEN RAISE EXCEPTION 'payload conflict not rejected'; END IF;
 SELECT spent INTO spent_now FROM geoapify_disposable.budget WHERE day_utc=d;
 IF spent_now<>3 THEN RAISE EXCEPTION 'double debit'; END IF;
 SELECT * INTO z FROM geoapify_disposable.lookup('tester','operation-00001',h);
 IF NOT z.found OR NOT z.matched OR z.reservation_id<>x.reservation_id THEN RAISE EXCEPTION 'lookup failed'; END IF;
 SELECT * INTO z FROM geoapify_disposable.reserve('tester','operation-00002',h,9,d);
 IF z.committed OR z.reason<>'INVALID_INPUT' THEN RAISE EXCEPTION 'oversized request accepted'; END IF;
 SELECT * INTO z FROM geoapify_disposable.reserve('tester','operation-00003',h,1,d-1);
 IF z.committed OR z.reason<>'INVALID_INPUT' THEN RAISE EXCEPTION 'stale date accepted'; END IF;
 RAISE NOTICE 'PASS reserve/replay/conflict/one debit/lookup/limits/stale date';
END $$;
ROLLBACK;
-- Real concurrency protocol (requires two independent psql sessions):
-- Session A: BEGIN; SELECT * FROM geoapify_disposable.reserve('tester','operation-00004',repeat('c',64),1,current_date); SELECT pg_sleep(2); COMMIT;
-- Session B (during A sleep): BEGIN; SELECT * FROM geoapify_disposable.reserve('tester','operation-00004',repeat('c',64),1,current_date); COMMIT;
-- Assert B returns REPLAY and budget increments once. Repeat with different hashes to assert conflict.
-- Unknown COMMIT: disconnect client after COMMIT send; reconnect, call lookup with SAME principal/operation/hash.
-- Do not treat network error as rollback; never generate a fresh operation ID automatically.
