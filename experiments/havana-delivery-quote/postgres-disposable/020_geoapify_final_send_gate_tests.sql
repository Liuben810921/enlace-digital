-- Disposable PostgreSQL only. Apply after 019. No provider calls.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('f',64); DECLARE v record; DECLARE a record;
DECLARE c record; DECLARE g record; DECLARE f record;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('send-valid','operation-send-valid-01',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('send-valid','operation-send-valid-01',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('send-valid','operation-send-valid-01',h,v.reservation_id,1,'event-send-valid-01');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'authorize'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-send-valid-01');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-send-valid-01','SUCCEEDED');
 IF f.applied IS DISTINCT FROM false THEN RAISE EXCEPTION 'finish before send gate'; END IF;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-send-valid-01');
 IF g.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'final gate'; END IF;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-send-valid-01');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'second send'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-send-valid-01','UNKNOWN');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'unknown'; END IF;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-send-valid-01');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'unknown resend'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-send-valid-01','SUCCEEDED');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'reconcile'; END IF;
 -- Strict revision and stale final gate.
 PERFORM geoapify_disposable.set_trusted_context('send-stale','operation-send-stale-01',1,h);
 BEGIN
  PERFORM geoapify_disposable.set_trusted_context('send-stale','operation-send-stale-01',1,repeat('a',64));
  RAISE EXCEPTION 'equal revision accepted changed digest';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='equal revision accepted changed digest' THEN RAISE; END IF;
 END;
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('send-stale','operation-send-stale-01',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('send-stale','operation-send-stale-01',h,v.reservation_id,1,'event-send-stale-01');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'authorize stale'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-send-stale-01');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim stale'; END IF;
 PERFORM geoapify_disposable.set_trusted_context('send-stale','operation-send-stale-01',2,repeat('b',64));
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-send-stale-01');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'stale final send'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-send-stale-02');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'stale reclaim'; END IF;
 RAISE NOTICE 'PASS one-time send gate, unknown quarantine, monotonic revision, stale final denial';
END $$;
ROLLBACK;
