-- NOT EXECUTED. DBA fixture, after existing synthetic context/role setup.
-- Two distinct intents for the SAME actor and operation, different nonce hashes.
-- This is allowed by the intent UNIQUE(actor,operation,action), so use separate actions
-- only for distinct-intent race? The unique constraint blocks same action + operation.
-- To reproduce approval uniqueness race, use two distinct operation identifiers in intents
-- that collide only after a future canonical mapping; current schema prevents same key.
-- CURRENT EXPECTATION: second INSERT with same actor,operation,action must fail UNIQUE.
-- This script deliberately attempts the conflict; run in disposable DB with ON_ERROR_STOP=off.
INSERT INTO ed_delivery_intent_lab.intents
(nonce_hash,actor_id,operation_id,action,audience,context_hash,context_revision,fee_cup,expires_at)
VALUES(repeat('c',64),'synthetic-admin','synthetic-op-1','approve',
'havana-delivery-admin',repeat('a',64),1,600,clock_timestamp()+interval '10 minutes');
-- Expected: unique_violation; original intent remains unchanged.
