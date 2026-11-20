-- DISPOSABLE PostgreSQL only. No reviewer grants, no live connections.
-- Fail-closed privilege boundary: reviewer logins may EXECUTE ONLY.
-- Installation prerequisite: migration operator owns schema/functions/tables.
BEGIN;
-- A dedicated NOLOGIN executor must be provisioned separately by an authorized
-- disposable-DB operator and granted only SELECT/UPDATE on the required rows.
-- Do not assign SECURITY DEFINER to a superuser or BYPASSRLS role.
-- This migration deliberately does not activate SECURITY DEFINER until
-- the owner and its grants can be verified in a disposable engine.
CREATE TABLE geoapify_disposable.reconciliation_privilege_policy (
 policy_id integer PRIMARY KEY CHECK (policy_id=1),
 enabled boolean NOT NULL DEFAULT false CHECK (enabled=false),
 owner_role name,
 reviewed_at timestamptz,
 CHECK(owner_role IS NULL OR owner_role::text !~ '^(postgres|supabase_admin)$')
);
INSERT INTO geoapify_disposable.reconciliation_privilege_policy(policy_id) VALUES(1);
REVOKE ALL ON geoapify_disposable.reconciliation_privilege_policy FROM PUBLIC;
-- Explicitly keep the existing SECURITY INVOKER RPCs unexecutable by PUBLIC.
REVOKE ALL ON FUNCTION geoapify_disposable.record_reconciliation_evidence(uuid,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.reconcile_dispatch(uuid,text,text,text,text) FROM PUBLIC;
-- Reject direct DML for any reviewer named in the allowlist at validation time.
-- This is an inspection function for privileged disposable operators only.
CREATE FUNCTION geoapify_disposable.inspect_reviewer_table_access()
RETURNS TABLE(reviewer name,unsafe_table text,unsafe_privilege text)
LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
 SELECT rr.db_role, t.table_name, p.privilege
 FROM geoapify_disposable.reconciliation_reviewer rr
 CROSS JOIN (VALUES
  ('dispatch_outbox'),('reservation'),('trusted_context'),
  ('context_freeze_audit'),('reconciliation_evidence'),('reconciliation_reviewer')
 ) t(table_name)
 CROSS JOIN (VALUES ('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE')) p(privilege)
 WHERE has_table_privilege(rr.db_role::text,
  format('geoapify_disposable.%I',t.table_name),p.privilege)
$$;
REVOKE ALL ON FUNCTION geoapify_disposable.inspect_reviewer_table_access() FROM PUBLIC;
COMMIT;
