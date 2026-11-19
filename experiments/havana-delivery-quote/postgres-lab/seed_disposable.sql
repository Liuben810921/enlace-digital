-- LAB ONLY. Execute as disposable database owner after both schema files.
INSERT INTO ed_delivery_lab.configuration(singleton,revision,payload) VALUES(true,1,'{}'::jsonb)
 ON CONFLICT(singleton) DO NOTHING;
INSERT INTO ed_delivery_lab.context_state(singleton,fingerprint,configuration_revision)
 VALUES(true,repeat('a',64),1) ON CONFLICT(singleton) DO NOTHING;
INSERT INTO ed_delivery_lab.actor_grants(actor_id,role,enabled)
 VALUES('owner','principal',true),('viewer','supervisor',true)
 ON CONFLICT(actor_id) DO NOTHING;
-- This mock context is NOT recomputed from a real cart; lab tests do not validate business authenticity.
