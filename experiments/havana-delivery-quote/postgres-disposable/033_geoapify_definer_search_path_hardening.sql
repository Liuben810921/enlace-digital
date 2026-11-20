-- Disposable-only, after 032. Harden disabled SECURITY DEFINER wrappers.
BEGIN;
ALTER FUNCTION geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)
 SET search_path TO pg_catalog,geoapify_disposable,pg_temp;
ALTER FUNCTION geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)
 SET search_path TO pg_catalog,geoapify_disposable,pg_temp;
-- Non-executable identity contract: login must be read from session_user,
-- never from user parameters, mutable GUCs or current_user inside definer.
-- No permissions or state transitions are granted.
CREATE FUNCTION geoapify_disposable.inspect_session_identity_contract()
RETURNS TABLE(check_name text, safe boolean)
LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable,pg_temp AS $$
 SELECT 'wrapper_paths_hardened'::text,
  count(*)=2
 FROM pg_catalog.pg_proc p
 WHERE p.oid IN (
  'geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text)'::regprocedure,
  'geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text)'::regprocedure)
 AND p.prosecdef
 AND EXISTS(SELECT 1 FROM unnest(p.proconfig) cfg
  WHERE cfg='search_path=pg_catalog,geoapify_disposable,pg_temp')
 UNION ALL
 SELECT 'executor_not_login_member'::text,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles r
   WHERE r.rolcanlogin AND pg_catalog.pg_has_role(r.oid,'ed_reconcile_executor','MEMBER'))
 UNION ALL
 SELECT 'no_executor_table_ownership'::text,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c
   WHERE c.relowner='ed_reconcile_executor'::regrole
   AND c.oid IN (
    'geoapify_disposable.reservation'::regclass,
    'geoapify_disposable.dispatch_outbox'::regclass,
    'geoapify_disposable.reconciliation_evidence'::regclass,
    'geoapify_disposable.context_freeze_audit'::regclass))
$$;
REVOKE ALL ON FUNCTION geoapify_disposable.inspect_session_identity_contract() FROM PUBLIC;
COMMIT;
