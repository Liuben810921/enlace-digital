-- DISPOSABLE POSTGRESQL ONLY. NOT EXECUTED.
-- Prerequisite: two actual LOGIN connections ed_lab_owner and ed_lab_viewer,
-- ed_delivery_lab_api membership granted by DBA, schema and seed installed.
-- Run as ed_lab_viewer (supervisor), NOT via SET ROLE.
SELECT session_user AS authenticated_login;
SELECT * FROM ed_delivery_lab.approve('attack-supervisor',999,repeat('a',64),1);
SELECT ed_delivery_lab.revoke(1);
-- Both must return PENDIENTE; direct table access must raise permission denied:
SELECT * FROM ed_delivery_lab.approvals;
INSERT INTO ed_delivery_lab.actor_grants(actor_id,role,enabled)
 VALUES('ed_lab_viewer','principal',true);
-- Both direct SQL statements must fail. Do not run with ON_ERROR_STOP=1 if checking all.
-- Attempting SET ROLE ed_delivery_lab_api must not change session_user:
-- SET ROLE ed_delivery_lab_api; SELECT session_user, current_user;
-- A direct client with owner/superuser rights is OUTSIDE this threat model.
