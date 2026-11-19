-- NOT EXECUTED. Disposable PostgreSQL DBA ONLY. After shared_pool_intents.sql.
-- No passwords or network services. Local DBA configures peer/trust only in isolated DB.
BEGIN;
CREATE ROLE ed_intent_test_pool LOGIN NOINHERIT NOBYPASSRLS;
CREATE ROLE ed_intent_test_gateway LOGIN NOINHERIT NOBYPASSRLS;
GRANT ed_intent_pool TO ed_intent_test_pool;
-- NOINHERIT: explicitly SET ROLE ed_intent_pool in each disposable test session.
GRANT ed_intent_gateway TO ed_intent_test_gateway;
-- A separate gateway test session must SET ROLE ed_intent_gateway.
-- On PostgreSQL 16+, membership SET/INHERIT options must be reviewed by DBA.
-- No membership in ed_intent_owner and no cross-membership.
COMMIT;
-- For testing as a local DBA session: SET ROLE ed_intent_pool;
-- This verifies effective permissions but is NOT a substitute for testing LOGIN isolation.
