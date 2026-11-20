-- Execute ONLY on disposable local PostgreSQL after 001 and 003. All test mutations ROLLBACK.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE m timestamptz := date_trunc('minute', clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
DECLARE h text := repeat('d',64);
DECLARE x record; DECLARE y record; DECLARE spent_day integer; DECLARE spent_minute integer;
BEGIN
 SELECT * INTO x FROM geoapify_disposable.reserve('minute-test','operation-minute-0001',h,8,d);
 IF NOT x.committed OR x.reason<>'RESERVED' THEN RAISE EXCEPTION 'first reserve: %',x.reason; END IF;
 SELECT * INTO y FROM geoapify_disposable.reserve('minute-test','operation-minute-0001',h,8,d-1);
 IF NOT y.committed OR y.reason<>'REPLAY_RESERVED' OR y.reservation_id<>x.reservation_id THEN RAISE EXCEPTION 'cross-day replay failed'; END IF;
 SELECT * INTO y FROM geoapify_disposable.reserve('minute-test','operation-minute-0001',repeat('e',64),8,d);
 IF y.committed OR y.reason<>'IDEMPOTENCY_CONFLICT' THEN RAISE EXCEPTION 'hash conflict'; END IF;
 UPDATE geoapify_disposable.minute_budget SET spent=29 WHERE minute_utc=m;
 SELECT * INTO y FROM geoapify_disposable.reserve('minute-test','operation-minute-0002',h,2,d);
 IF y.committed OR y.reason<>'MINUTE_BUDGET_EXCEEDED' THEN RAISE EXCEPTION 'minute quota failed: %',y.reason; END IF;
 UPDATE geoapify_disposable.minute_budget SET spent=8 WHERE minute_utc=m;
 UPDATE geoapify_disposable.budget SET spent=2399 WHERE day_utc=d;
 SELECT * INTO y FROM geoapify_disposable.reserve('minute-test','operation-minute-0003',h,2,d);
 IF y.committed OR y.reason<>'DAILY_BUDGET_EXCEEDED' THEN RAISE EXCEPTION 'daily quota failed: %',y.reason; END IF;
 SELECT spent INTO spent_day FROM geoapify_disposable.budget WHERE day_utc=d;
 SELECT spent INTO spent_minute FROM geoapify_disposable.minute_budget WHERE minute_utc=m;
 IF spent_day<>2399 OR spent_minute<>8 THEN RAISE EXCEPTION 'failed reservation debited credits'; END IF;
 SELECT * INTO y FROM geoapify_disposable.lookup('minute-test','operation-minute-0001',h);
 IF NOT y.found OR NOT y.matched OR y.reservation_id<>x.reservation_id THEN RAISE EXCEPTION 'unknown commit reconciliation lookup failed'; END IF;
 RAISE NOTICE 'PASS minute budget, daily saturation boundary, idempotent replay, conflict, no failed debit, lookup';
END $$;
ROLLBACK;
-- Saturation under concurrent sessions must be executed in real PostgreSQL separately.
-- Reconcile unknown COMMIT with lookup using the SAME principal and operation ID.
-- A missing lookup after a network failure does NOT prove rollback; never issue a new operation ID.
