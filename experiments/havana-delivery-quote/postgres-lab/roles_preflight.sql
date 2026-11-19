-- DISPOSABLE DATABASE DBA ONLY; before manual_approval_rpc.sql. NOT EXECUTED.
-- No passwords, connections or external services are created by this file.
BEGIN;
CREATE ROLE ed_delivery_lab_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE ed_delivery_lab_api NOLOGIN NOBYPASSRLS;
-- Test LOGIN roles are deliberately NOT created here; provision via local DBA.
-- ed_delivery_lab_owner owns only the three SECURITY DEFINER functions.
-- Grant table privileges explicitly in manual_approval_rpc.sql.
-- DBA must ensure schema ownership is NOT held by the API or test LOGIN roles.
COMMIT;
