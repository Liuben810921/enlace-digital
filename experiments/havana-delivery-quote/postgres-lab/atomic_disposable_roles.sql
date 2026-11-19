-- NOT EXECUTED. Dedicated disposable CLUSTER only. Test login roles pre-created by operator.
-- Run after shared_pool_intents.sql. Never CREATE LOGIN roles inside the test runner.
BEGIN;
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ed_intent_test_pool' AND rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolinherit)
 OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ed_intent_test_gateway' AND rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolinherit)
 THEN RAISE EXCEPTION 'Disposable test login roles must be pre-provisioned with LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS'; END IF;
END $$;
GRANT ed_intent_pool TO ed_intent_test_pool;
GRANT ed_intent_gateway TO ed_intent_test_gateway;
COMMIT;
-- Operator must use a separate, fully disposable PostgreSQL cluster.
