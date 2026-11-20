-- Disposable PostgreSQL only, after 015. Rollback-only, no provider.
-- A lost acknowledgement must never create a second claim or dispatch.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('e',64);
DECLARE v record; DECLARE a record; DECLARE c record; DECLARE f record;
DECLARE n integer;
BEGIN
 PERFORM geoapify_disposable.set_trusted_context('recovery-test','operation-recovery-0001',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('recovery-test','operation-recovery-0001',h,1,d);
 IF v.committed IS DISTINCT FROM true THEN RAISE EXCEPTION 'reservation failed'; END IF;
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('recovery-test','operation-recovery-0001',h,v.reservation_id,1,'event-recovery-0001');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'dispatch authorization failed'; END IF;
 -- Simulate lost response to authorization: query durable state, do not authorize again.
 SELECT count(*) INTO n FROM geoapify_disposable.dispatch_outbox WHERE reservation_id=v.reservation_id AND state='READY';
 IF n<>1 THEN RAISE EXCEPTION 'outbox not durable'; END IF;
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('recovery-test','operation-recovery-0001',h,v.reservation_id,1,'event-recovery-0001');
 IF a.authorized IS DISTINCT FROM false THEN RAISE EXCEPTION 'authorization replay'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-recovery-0001');
 IF c.claimed IS DISTINCT FROM true THEN RAISE EXCEPTION 'claim failed'; END IF;
 -- Lost claim acknowledgement: state remains CLAIMED and no second claim is allowed.
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-recovery-0001');
 IF c.claimed IS DISTINCT FROM false OR c.state<>'CLAIMED' THEN RAISE EXCEPTION 'claim replay'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-recovery-0002');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'claim takeover'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-recovery-0001','UNKNOWN');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'unknown quarantine'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-recovery-0003');
 IF c.claimed IS DISTINCT FROM false OR c.state<>'UNKNOWN' THEN RAISE EXCEPTION 'unknown retry'; END IF;
 -- Reconciliation based on evidence (simulated); no transport call.
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-recovery-0001','FAILED_CHARGED');
 IF f.applied IS DISTINCT FROM true THEN RAISE EXCEPTION 'reconciliation failed'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-recovery-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM false THEN RAISE EXCEPTION 'contradictory final outcome'; END IF;
 SELECT count(*) INTO n FROM geoapify_disposable.reservation_event
 WHERE reservation_id=v.reservation_id AND outcome='FAILED_CHARGED';
 IF n<>1 THEN RAISE EXCEPTION 'duplicate ledger finalization'; END IF;
 RAISE NOTICE 'PASS lost acknowledgements, unknown quarantine, no takeover, final outcome conflict';
END $$;
ROLLBACK;
