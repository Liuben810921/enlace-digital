-- NOT EXECUTED. DBA-only psql script. -v operation_id=synthetic-op-1 or synthetic-revoke-1
-- Must run AFTER A and B finish; intended result is exactly one committed effect.
\set ON_ERROR_STOP on
SELECT set_config('ed_lab.operation', :'operation_id', false);
DO $
DECLARE v_count integer; v_consumed integer; v_effect integer;
BEGIN
 SELECT count(*),count(*) FILTER (WHERE consumed_at IS NOT NULL)
 INTO v_count,v_consumed FROM ed_delivery_intent_lab.intents
 WHERE operation_id=current_setting('ed_lab.operation');
 IF v_count<>1 OR v_consumed<>1 THEN RAISE EXCEPTION 'Intent count/consumption mismatch: %, %',v_count,v_consumed; END IF;
 IF current_setting('ed_lab.operation')='synthetic-op-1' THEN
  SELECT count(*) INTO v_effect FROM ed_delivery_lab.approvals
  WHERE actor_id='synthetic-admin' AND operation_id='synthetic-op-1' AND revoked_at IS NULL;
 ELSIF current_setting('ed_lab.operation')='synthetic-revoke-1' THEN
  SELECT count(*) INTO v_effect FROM ed_delivery_lab.approvals
  WHERE actor_id='synthetic-admin' AND operation_id='synthetic-revoke-target' AND revoked_at IS NOT NULL;
 ELSE RAISE EXCEPTION 'Unknown synthetic operation'; END IF;
 IF v_effect<>1 THEN RAISE EXCEPTION 'Expected exactly one committed effect, got %',v_effect; END IF;
END $$;
-- This script is psql-specific and must not be fed through a generic SQL driver.
