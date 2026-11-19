-- NOT EXECUTED. Disposable DBA only, run after atomic_two_connections_setup.sql.
-- The approval is inserted directly as a SYNTHETIC fixture; no customer or order data.
BEGIN;
INSERT INTO ed_delivery_lab.approvals
(actor_id,operation_id,request_fingerprint,configuration_revision,fee_cup,expires_at)
VALUES ('synthetic-admin','synthetic-revoke-target',repeat('a',64),1,600,clock_timestamp()+interval '20 minutes');
INSERT INTO ed_delivery_intent_lab.intents
(nonce_hash,actor_id,operation_id,action,audience,context_hash,context_revision,target_approval_id,expires_at)
SELECT repeat('d',64),'synthetic-admin','synthetic-revoke-1','revoke',
'havana-delivery-admin',repeat('a',64),1,id,clock_timestamp()+interval '10 minutes'
FROM ed_delivery_lab.approvals WHERE actor_id='synthetic-admin' AND operation_id='synthetic-revoke-target';
COMMIT;
SELECT intent_id AS revoke_intent_id,nonce_hash AS revoke_nonce_hash
FROM ed_delivery_intent_lab.intents WHERE operation_id='synthetic-revoke-1';
-- Assert exactly one returned row before starting two sessions.
