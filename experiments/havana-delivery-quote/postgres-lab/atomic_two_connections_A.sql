-- NOT EXECUTED. Disposable DB, authenticated pool test login with ed_intent_pool only.
-- DBA seeds a valid intent and authoritative_context + admin_roles beforehand.
-- Replace :intent_id and :nonce_hash with values issued by trusted synthetic gateway.
BEGIN;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS result_a;
-- Keep transaction open while connection B attempts the same intent.
SELECT pg_sleep(5);
COMMIT;
-- Expected A: LAB_APPLIED_ONLY only for fully valid synthetic data.
