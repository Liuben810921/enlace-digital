-- Disposable PostgreSQL ONLY, apply after 017. All changes rolled back.
BEGIN;
DO $$
DECLARE d date := (clock_timestamp() AT TIME ZONE 'UTC')::date;
DECLARE h text := repeat('c',64);
DECLARE v record; DECLARE a record; DECLARE c record; DECLARE f record;
BEGIN
 -- Stale revision after dispatch, before claim: permanent quarantine.
 PERFORM geoapify_disposable.set_trusted_context('claim-stale','operation-claim-stale-01',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('claim-stale','operation-claim-stale-01',h,1,d);
 IF v.committed IS DISTINCT FROM true THEN RAISE EXCEPTION 'reserve stale'; END IF;
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('claim-stale','operation-claim-stale-01',h,v.reservation_id,1,'event-claim-stale-01');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'authorize stale'; END IF;
 PERFORM geoapify_disposable.set_trusted_context('claim-stale','operation-claim-stale-01',2,h);
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-stale-0001');
 IF c.claimed IS DISTINCT FROM false OR c.state<>'QUARANTINED' OR c.reason<>'CONTEXT_STALE_QUARANTINED' THEN
  RAISE EXCEPTION 'stale revision not quarantined'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-stale-0002');
 IF c.claimed IS DISTINCT FROM false OR c.state<>'QUARANTINED' THEN RAISE EXCEPTION 'quarantine bypass'; END IF;
 SELECT * INTO f FROM geoapify_disposable.finish_dispatch(v.reservation_id,'claim-stale-0001','SUCCEEDED');
 IF f.applied IS DISTINCT FROM false THEN RAISE EXCEPTION 'quarantined finalization'; END IF;
 -- Same revision, changed digest also quarantines.
 PERFORM geoapify_disposable.set_trusted_context('claim-digest','operation-claim-digest-01',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('claim-digest','operation-claim-digest-01',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('claim-digest','operation-claim-digest-01',h,v.reservation_id,1,'event-claim-digest-01');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'authorize digest'; END IF;
 PERFORM geoapify_disposable.set_trusted_context('claim-digest','operation-claim-digest-01',1,repeat('d',64));
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-digest-0001');
 IF c.state<>'QUARANTINED' THEN RAISE EXCEPTION 'digest mismatch bypass'; END IF;
 -- Unchanged context permits one claim, never a second.
 PERFORM geoapify_disposable.set_trusted_context('claim-valid','operation-claim-valid-01',1,h);
 SELECT * INTO v FROM geoapify_disposable.reserve_contract('claim-valid','operation-claim-valid-01',h,1,d);
 SELECT * INTO a FROM geoapify_disposable.authorize_dispatch_contract('claim-valid','operation-claim-valid-01',h,v.reservation_id,1,'event-claim-valid-01');
 IF a.authorized IS DISTINCT FROM true THEN RAISE EXCEPTION 'authorize valid'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-valid-0001');
 IF c.claimed IS DISTINCT FROM true OR c.state<>'CLAIMED' THEN RAISE EXCEPTION 'valid claim rejected'; END IF;
 SELECT * INTO c FROM geoapify_disposable.claim_dispatch(v.reservation_id,'claim-valid-0002');
 IF c.claimed IS DISTINCT FROM false THEN RAISE EXCEPTION 'duplicate valid claim'; END IF;
 RAISE NOTICE 'PASS stale revision quarantine, digest quarantine, no reclaim, valid single claim';
END $$;
ROLLBACK;
