-- Applied to staging before staging-delivery-schema.sql on 2026-11-24.
-- The membership is temporary: staging-delivery-schema.sql revokes it before COMMIT.
-- The dedicated owner stays NOLOGIN, NOINHERIT, NOBYPASSRLS and non-superuser.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ed_delivery_staging_rpc') THEN
  CREATE ROLE ed_delivery_staging_rpc NOLOGIN NOINHERIT NOBYPASSRLS;
 END IF;
END $$;
GRANT ed_delivery_staging_rpc TO postgres;
