-- NOT EXECUTED. Reinitialize disposable fixture before this alternative.
SET application_name = 'ed_atomic_lab_a';
SET ROLE ed_intent_pool;
BEGIN;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS a_result;
\echo A_LOCK_HELD
SELECT pg_sleep(18);
ROLLBACK;
RESET ROLE;
