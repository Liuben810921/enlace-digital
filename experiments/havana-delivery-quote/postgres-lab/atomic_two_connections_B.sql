-- NOT EXECUTED. Independent disposable pool connection, same intent and nonce as A.
-- Start while A holds its transaction; B should wait for intent row lock.
BEGIN;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS result_b;
COMMIT;
-- Expected B: PENDIENTE after A commits; one approval and consumed_at set once.
-- Repeat with A ROLLBACK instead: B may succeed, without partial approval from A.
