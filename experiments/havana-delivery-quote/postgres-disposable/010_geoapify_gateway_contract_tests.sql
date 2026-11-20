-- Disposable PostgreSQL only; run after 001,003,005,007,009.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('c',64); DECLARE v record; DECLARE t record; DECLARE t2 record;
BEGIN
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('contract-test','operation-contract-0001',h,1,d);
 IF v.committed IS DISTINCT FROM true OR v.context_digest<>h OR v.lifecycle<>'RESERVED' THEN RAISE EXCEPTION 'reserve contract'; END IF;
 SELECT * INTO t FROM geoapify_disposable.authorize_dispatch_contract('contract-test','operation-contract-0001',h,v.reservation_id,2,'event-contract-0001');
 IF t.authorized IS DISTINCT FROM true OR t.reason<>'APPLIED' OR t.context_digest<>h OR t.context_revision<>2 THEN RAISE EXCEPTION 'dispatch contract'; END IF;
 SELECT * INTO t2 FROM geoapify_disposable.authorize_dispatch_contract('contract-test','operation-contract-0001',h,v.reservation_id,2,'event-contract-0001');
 IF t2.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'double dispatch'; END IF;
 SELECT * INTO t2 FROM geoapify_disposable.reserve_contract('contract-test','operation-contract-0001',h,1,d);
 IF t2.committed IS DISTINCT FROM false THEN RAISE EXCEPTION 'dispatch replay'; END IF;
 SELECT * INTO t2 FROM geoapify_disposable.authorize_dispatch_contract('contract-test','operation-contract-0001',repeat('d',64),v.reservation_id,2,'event-contract-0002');
 IF t2.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'context mismatch'; END IF;
 RAISE NOTICE 'PASS digest contract, one-time dispatch, no replay and mismatch';
END $$;
ROLLBACK;
