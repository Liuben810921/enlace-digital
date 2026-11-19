-- NOT EXECUTED. psql -v intent_id=... -v nonce_hash=... -f thisfile
-- Connect as isolated pool test LOGIN; activate role explicitly because NOINHERIT.
SET ROLE ed_intent_pool;
BEGIN;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS a_result;
\echo A_LOCK_HELD
SELECT pg_sleep(8);
COMMIT;
RESET ROLE;
