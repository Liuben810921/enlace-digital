-- Disposable PostgreSQL only. Apply 011 first. All assertions rollback.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('a',64); DECLARE h2 text := repeat('b',64);
DECLARE v record; DECLARE t record;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('ctx-test','operation-context-0001',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('ctx-test','operation-context-0001',h,1,d);
 IF v.committed IS DISTINCT FROM true THEN RAISE EXCEPTION 'reserve'; END IF;
 PERFORM geoapify_disposable.set_trusted_context('ctx-test','operation-context-0001',2,h2);
 SELECT * INTO t FROM geoapify_disposable.authorize_dispatch_contract('ctx-test','operation-context-0001',h,v.reservation_id,1,'event-context-0001');
 IF t.authorized IS DISTINCT FROM false OR t.reason<>'CONTEXT_NOT_CURRENT' THEN RAISE EXCEPTION 'stale dispatch'; END IF;
 SELECT * INTO t FROM geoapify_disposable.authorize_dispatch_contract('ctx-test','operation-context-0001',h2,v.reservation_id,2,'event-context-0002');
 IF t.authorized IS DISTINCT FROM false OR t.reason<>'NOT_DISPATCHABLE' THEN RAISE EXCEPTION 'digest mismatch'; END IF;
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('ctx-test','operation-context-0002',h,1,d);
 PERFORM geoapify_disposable.set_trusted_context('ctx-test','operation-context-0002',3,h);
 SELECT * INTO t FROM geoapify_disposable.authorize_dispatch_contract('ctx-test','operation-context-0002',h,v.reservation_id,3,'event-context-0003');
 IF t.authorized IS DISTINCT FROM true OR t.reason<>'APPLIED' THEN RAISE EXCEPTION 'first dispatch'; END IF;
 SELECT * INTO t FROM geoapify_disposable.authorize_dispatch_contract('ctx-test','operation-context-0002',h,v.reservation_id,3,'event-context-0003');
 IF t.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'duplicate dispatch'; END IF;
 RAISE NOTICE 'PASS stale revision, digest mismatch, first dispatch, duplicate dispatch';
END $$;
ROLLBACK;
