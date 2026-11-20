-- Disposable SQL only, run after 013. No provider calls. Rollback assertions.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('a',64); DECLARE v record; DECLARE a record; DECLARE c record; DECLARE f record;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('outbox-test','operation-outbox-0001',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('outbox-test','operation-outbox-0001',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('outbox-test','operation-outbox-0001',h,v.reservation_id,1,'event-outbox-0001');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'dispatch'; END IF;
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('outbox-test','operation-outbox-0001',h,v.reservation_id,1,'event-outbox-0001');
 IF a.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'duplicate outbox'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-outbox-0001');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-outbox-0002');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'double claim'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-outbox-0002','SUCCEEDED');
 IF f.applied IS DISTINCT FROM false THEN RAISE EXCEPTION 'wrong token'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-outbox-0001','UNKNOWN');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'unknown'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-outbox-0003');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'unsafe retry'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-outbox-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'reconciliation'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-outbox-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM false THEN RAISE EXCEPTION 'duplicate finalization'; END IF;
 RAISE NOTICE 'PASS outbox single dispatch, single claim, unknown quarantine, reconciliation, finalization replay';
END $$;
ROLLBACK;
