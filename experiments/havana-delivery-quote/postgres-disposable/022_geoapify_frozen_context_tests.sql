-- Disposable PostgreSQL only. Run after 021. All changes rolled back.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('a',64); DECLARE v record; DECLARE a record;
DECLARE c record; DECLARE g record; DECLARE f record;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('freeze-test','operation-freeze-0001',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('freeze-test','operation-freeze-0001',h,v.reservation_id,1,'event-freeze-0001');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'authorize'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-freeze-0001');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim'; END IF;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-freeze-0001');
 IF g.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'send gate'; END IF;
 -- A concurrent writer serialized after gate must be denied; no revision drift.
 BEGIN
  PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',2,repeat('b',64));
  RAISE EXCEPTION 'mutation incorrectly allowed during SEND_AUTHORIZED';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='mutation incorrectly allowed during SEND_AUTHORIZED' THEN RAISE; END IF;
  IF SQLERRM NOT LIKE 'context frozen%' THEN RAISE; END IF;
 END;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-freeze-0001');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'double send gate'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-freeze-0001','UNKNOWN');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'unknown'; END IF;
 BEGIN
  PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',2,repeat('b',64));
  RAISE EXCEPTION 'mutation incorrectly allowed during UNKNOWN';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='mutation incorrectly allowed during UNKNOWN' THEN RAISE; END IF;
  IF SQLERRM NOT LIKE 'context frozen%' THEN RAISE; END IF;
 END;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-freeze-0002');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'unknown re-claim'; END IF;
 -- Reconciliation uses original claim token; terminal outcome ends freeze,
 -- but never reopens this outbox for another send.
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-freeze-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'reconciliation'; END IF;
 PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',2,repeat('b',64));
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-freeze-0001');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'terminal resend'; END IF;
 RAISE NOTICE 'PASS frozen context after gate, unknown freeze, reconciliation, no resend';
END $$;
ROLLBACK;
