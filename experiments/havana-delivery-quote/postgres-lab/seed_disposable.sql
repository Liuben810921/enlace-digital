-- LAB ONLY. Execute as disposable database owner after both schema files.
-- DBA prerequisite in disposable database: CREATE ROLE ed_delivery_lab_api NOLOGIN;
-- CREATE ROLE ed_lab_owner LOGIN; CREATE ROLE ed_lab_viewer LOGIN;
-- GRANT ed_delivery_lab_api TO ed_lab_owner,ed_lab_viewer;
-- Connect separately AS ed_lab_owner and ed_lab_viewer (not SET ROLE).
INSERT INTO ed_delivery_lab.configuration(singleton,revision,payload) VALUES(true,1,'{}'::jsonb)
 ON CONFLICT(singleton) DO NOTHING;
INSERT INTO ed_delivery_lab.context_state(singleton,fingerprint,configuration_revision)
 VALUES(true,repeat('a',64),1) ON CONFLICT(singleton) DO NOTHING;
INSERT INTO ed_delivery_lab.actor_grants(actor_id,role,enabled)
 VALUES('ed_lab_owner','principal',true),('ed_lab_viewer','supervisor',true)
 ON CONFLICT(actor_id) DO NOTHING;
-- This mock context is NOT recomputed from a real cart; lab tests do not validate business authenticity.
