-- Disposable PostgreSQL ONLY. Apply after 021; all synthetic data rolled back.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('9',64); DECLARE v record; DECLARE a record;
DECLARE c record; DECLARE g record; DECLARE f record; DECLARE n integer;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('freeze-test','operation-freeze-0001',h,1,d);
 IF v.committed IS DISTINCT FROM true THEN RAISE EXCEPTION 'reserve failed'; END IF;
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('freeze-test','operation-freeze-0001',h,v.reservation_id,1,'event-freeze-0001');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'dispatch failed'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-freeze-0001');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim failed'; END IF;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-freeze-0001');
 IF g.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'send gate failed'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.context_freeze_audit
 WHERE reservation_id=v.reservation_id AND released_at IS NULL;
 IF n<>1 THEN RAISE EXCEPTION 'freeze not durable in transaction'; END IF;
 -- Simulate concurrent writer AFTER send gate: both version increment and no-op rejected.
 BEGIN
  PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',2,repeat('8',64));
  RAISE EXCEPTION 'context changed while frozen';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='context changed while frozen' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',1,h);
  RAISE EXCEPTION 'idempotent writer bypassed freeze';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='idempotent writer bypassed freeze' THEN RAISE; END IF;
 END;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-freeze-0001');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'duplicate send gate'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-freeze-0001','UNKNOWN');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'unknown failed'; END IF;
 BEGIN
  PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',2,repeat('8',64));
  RAISE EXCEPTION 'unknown released freeze';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='unknown released freeze' THEN RAISE; END IF;
 END;
 SELECT * INTO g FROM geoapify_disposable.authorize_send_once(v.reservation_id,'claim-freeze-0001');
 IF g.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'unknown resend'; END IF;
 -- Synthetic evidence-based reconciliation only, no provider.
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-freeze-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'terminal reconciliation'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.context_freeze_audit
 WHERE reservation_id=v.reservation_id AND released_at IS NOT NULL;
 IF n<>1 THEN RAISE EXCEPTION 'freeze not released on terminal'; END IF;
 PERFORM geoapify_disposable.set_trusted_context('freeze-test','operation-freeze-0001',2,repeat('8',64));
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-freeze-0002');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'terminal resend'; END IF;
 RAISE NOTICE 'PASS freeze, writer denial, UNKNOWN retention, one-shot send, terminal release';
END $$;
ROLLBACK;
