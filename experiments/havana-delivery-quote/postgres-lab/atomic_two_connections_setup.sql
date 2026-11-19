-- NOT EXECUTED. DBA-only synthetic fixture after manual_approval.sql,
-- shared_pool_intents.sql, shared_pool_atomic_lab.sql.
-- This fixture is deliberately NOT a trusted business context.
INSERT INTO ed_delivery_intent_lab.authoritative_context(singleton,fingerprint,revision)
VALUES(true,repeat('a',64),1);
INSERT INTO ed_delivery_intent_lab.admin_roles(actor_id,role,enabled)
VALUES('synthetic-admin','principal',true),('synthetic-viewer','supervisor',true);
INSERT INTO ed_delivery_intent_lab.intents
(nonce_hash,actor_id,operation_id,action,audience,context_hash,context_revision,fee_cup,expires_at)
VALUES(repeat('b',64),'synthetic-admin','synthetic-op-1','approve',
'havana-delivery-admin',repeat('a',64),1,600,clock_timestamp()+interval '10 minutes')
RETURNING intent_id,nonce_hash;
-- Run A and B with returned values. Never reuse fixture in real systems.
