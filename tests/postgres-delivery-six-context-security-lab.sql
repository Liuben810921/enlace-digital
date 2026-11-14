-- Isolated security extension to disposable ed_quote_race lab; no Supabase objects.
BEGIN;
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ed_race_owner') THEN CREATE ROLE ed_race_owner NOLOGIN NOBYPASSRLS; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ed_race_manager_a') THEN CREATE ROLE ed_race_manager_a LOGIN PASSWORD 'disposable-race-only' NOBYPASSRLS; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ed_race_manager_b') THEN CREATE ROLE ed_race_manager_b LOGIN PASSWORD 'disposable-race-only' NOBYPASSRLS; END IF;
END $$;
CREATE TABLE ed_quote_race.manager_quotes(
 quote_id text PRIMARY KEY, manager_role name NOT NULL,
 context_id text NOT NULL REFERENCES ed_quote_race.context(id),
 status text NOT NULL DEFAULT 'prepared',
 CHECK(status IN ('prepared','confirmed','rejected'))
);
ALTER TABLE ed_quote_race.manager_quotes OWNER TO ed_race_owner;
ALTER TABLE ed_quote_race.manager_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_quote_race.manager_quotes FORCE ROW LEVEL SECURITY;
CREATE POLICY manager_own_quotes ON ed_quote_race.manager_quotes
 FOR ALL TO ed_race_manager_a,ed_race_manager_b
 USING(manager_role=current_user) WITH CHECK(manager_role=current_user);
GRANT USAGE ON SCHEMA ed_quote_race TO ed_race_manager_a,ed_race_manager_b;
GRANT SELECT,INSERT,UPDATE ON ed_quote_race.manager_quotes TO ed_race_manager_a,ed_race_manager_b;
GRANT SELECT ON ed_quote_race.context TO ed_race_manager_a,ed_race_manager_b;
-- No UPDATE context, no access to audit or unrestricted quotes.
REVOKE ALL ON ed_quote_race.context FROM ed_race_manager_a,ed_race_manager_b;
GRANT SELECT ON ed_quote_race.context TO ed_race_manager_a,ed_race_manager_b;
COMMIT;
