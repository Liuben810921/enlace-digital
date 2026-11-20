-- DISPOSABLE-ONLY, after 030. No activation or reviewer grants.
-- Diagnostic contract: session_user is the login identity; current_user inside
-- SECURITY DEFINER is the owner, NOT the reviewer. Never trust a caller GUC.
BEGIN;
CREATE FUNCTION geoapify_disposable.inspect_reconciliation_identity_boundary()
RETURNS TABLE(check_name text, safe boolean, detail text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable,pg_temp AS $$
DECLARE executor_oid oid; DECLARE unsafe_count integer; DECLARE role_rec record;
BEGIN
 SELECT oid INTO executor_oid FROM pg_catalog.pg_roles WHERE rolname='ed_reconcile_executor';
 RETURN QUERY SELECT 'executor_exists'::text, executor_oid IS NOT NULL, 'NOLOGIN executor'::text;
 IF executor_oid IS NULL THEN RETURN; END IF;
 RETURN QUERY SELECT 'executor_attributes'::text,
  NOT (r.rolcanlogin OR r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb),
  'NOLOGIN, no superuser, no bypassrls, no role/db creation'::text
 FROM pg_catalog.pg_roles r WHERE r.oid=executor_oid;
 -- Detect both direct and indirect memberships, not just rolcanlogin.
 SELECT count(*) INTO unsafe_count FROM pg_catalog.pg_roles r
 WHERE r.rolcanlogin AND pg_catalog.pg_has_role(r.oid,executor_oid,'MEMBER');
 RETURN QUERY SELECT 'no_login_executor_members'::text,unsafe_count=0,
  'login members of executor (direct or inherited): '||unsafe_count::text;
 SELECT count(*) INTO unsafe_count FROM geoapify_disposable.reconciliation_reviewer rr
 WHERE EXISTS(SELECT 1 FROM pg_catalog.pg_roles r
  WHERE r.rolname=rr.db_role AND (r.rolsuper OR r.rolbypassrls
   OR pg_catalog.pg_has_role(r.oid,executor_oid,'MEMBER')));
 RETURN QUERY SELECT 'reviewers_not_privileged'::text,unsafe_count=0,
  'reviewers with superuser/bypassrls/executor membership: '||unsafe_count::text;
 -- Table owners bypass RLS unless FORCE RLS; NOLOGIN does not prevent ownership bypass.
 SELECT count(*) INTO unsafe_count FROM pg_catalog.pg_class c
 WHERE c.oid IN (
  'geoapify_disposable.reconciliation_evidence'::regclass,
  'geoapify_disposable.reconciliation_reviewer'::regclass,
  'geoapify_disposable.dispatch_outbox'::regclass,
  'geoapify_disposable.context_freeze_audit'::regclass,
  'geoapify_disposable.reservation'::regclass)
 AND c.relowner=executor_oid AND NOT c.relforcerowsecurity;
 RETURN QUERY SELECT 'executor_no_rls_owner_bypass'::text,unsafe_count=0,
  'executor-owned sensitive tables without FORCE RLS: '||unsafe_count::text;
 -- Disabled wrappers must not be directly executable by PUBLIC.
 SELECT count(*) INTO unsafe_count FROM pg_catalog.pg_proc p,
 LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
 WHERE p.oid IN (
  'geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)'::regprocedure,
  'geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)'::regprocedure)
 AND a.grantee=0 AND a.privilege_type='EXECUTE';
 RETURN QUERY SELECT 'no_public_wrapper_execute'::text,unsafe_count=0,
  'PUBLIC execute ACL entries: '||unsafe_count::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.inspect_reconciliation_identity_boundary() FROM PUBLIC;
COMMIT;
