-- NOT EXECUTED. Start while session A is sleeping, using same intent_id/nonce_hash.
SET ROLE ed_intent_pool;
BEGIN;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS b_result;
COMMIT;
RESET ROLE;
