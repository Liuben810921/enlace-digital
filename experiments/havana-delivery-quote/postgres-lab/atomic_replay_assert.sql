-- NOT EXECUTED. Run as disposable pool test LOGIN, after A/B committed.
\set ON_ERROR_STOP on
SET ROLE ed_intent_pool;
DO $$
DECLARE v_result text;
BEGIN
 -- Replace the placeholders using psql \gset or use the SELECT below;
 -- DO does not interpolate psql variables: no SQL is executed here.
 NULL;
END $$;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS replay_expected_pendiente;
RESET ROLE;
-- Manually assert returned value is PENDIENTE; see orchestrator for automated assertion.
