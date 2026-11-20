-- Disposable-only. Rollback assertions; no reviewer roles or grants installed.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('7',64); DECLARE v record; DECLARE a record;
DECLARE c record; DECLARE g record; DECLARE f record; DECLARE n integer;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('review-test','operation-review-0001',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('review-test','operation-review-0001',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('review-test','operation-review-0001',h,v.reservation_id,1,'event-review-0001');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'dispatch'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-review-0001');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim'; END IF;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-review-0001');
 IF g.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'send authorization'; END IF;
 -- Unknown commit outcome: state lookup only; never replay send.
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-review-0001');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'unknown commit replay'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-review-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM false OR f.reason<>'RECONCILIATION_REQUIRED' THEN
  RAISE EXCEPTION 'legacy terminal bypass'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-review-0001','UNKNOWN');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'unknown quarantine'; END IF;
 IF geoapify_disposable.record_reconciliation_evidence(v.reservation_id,'claim-review-0001',
 'SUCCEEDED',repeat('a',64),'external-ref-0001') IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'unapproved reviewer'; END IF;
 SELECT * INTO f FROM geoapify_disposable.reconcile_dispatch(v.reservation_id,'claim-review-0001',
 'SUCCEEDED',repeat('a',64),'external-ref-0001');
 IF f.applied IS DISTINCT FROM false THEN RAISE EXCEPTION 'unapproved reconciliation'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.context_freeze_audit
 WHERE reservation_id=v.reservation_id AND released_at IS NULL;
 IF n<>1 THEN RAISE EXCEPTION 'unauthorized unfreeze'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-review-0002');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'unknown resend'; END IF;
 RAISE NOTICE 'PASS fail-closed reviewers, legacy bypass blocked, unknown freeze retained';
END $$;
ROLLBACK;
