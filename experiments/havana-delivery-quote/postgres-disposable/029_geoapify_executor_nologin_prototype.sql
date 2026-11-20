-- DISPOSABLE PostgreSQL PROTOTYPE ONLY; after 028.
-- NO activation, NO reviewer grants, NO provider calls.
-- A non-superuser migration owner must have CREATEROLE and CREATE on schema.
BEGIN;
CREATE ROLE ed_reconcile_executor NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
GRANT USAGE, CREATE ON SCHEMA geoapify_disposable TO ed_reconcile_executor;
GRANT SELECT ON geoapify_disposable.reconciliation_reviewer,
 geoapify_disposable.reconciliation_evidence,
 geoapify_disposable.dispatch_outbox,
 geoapify_disposable.context_freeze_audit,
 geoapify_disposable.reservation,
 geoapify_disposable.reservation_event TO ed_reconcile_executor;
GRANT INSERT ON geoapify_disposable.reconciliation_evidence,
 geoapify_disposable.reservation_event TO ed_reconcile_executor;
GRANT UPDATE(state,finalized_at) ON geoapify_disposable.dispatch_outbox TO ed_reconcile_executor;
GRANT UPDATE(released_at) ON geoapify_disposable.context_freeze_audit TO ed_reconcile_executor;
GRANT UPDATE(lifecycle,outcome_token,dispatched_at,finalized_at)
 ON geoapify_disposable.reservation TO ed_reconcile_executor;
GRANT EXECUTE ON FUNCTION geoapify_disposable.transition(text,text,text,text,text)
 TO ed_reconcile_executor;
-- Wrapper owner can call the existing INVOKER functions, but those functions
-- currently reject current_user<>session_user. Hence wrappers deliberately
-- DENY all operations until the inner identity contract is safely redesigned.
CREATE FUNCTION geoapify_disposable.reviewer_attest_guarded(
 p_reservation_id uuid,p_claim_token text,p_outcome text,
 p_evidence_digest text,p_external_reference text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
 SET search_path=pg_catalog,geoapify_disposable AS $$
BEGIN
 -- Unconditionally disabled: the inner INVOKER function currently checks
 -- current_user=session_user, which is false under SECURITY DEFINER.
 RETURN false;
END $$;
CREATE FUNCTION geoapify_disposable.reviewer_reconcile_guarded(
 p_reservation_id uuid,p_claim_token text,p_outcome text,
 p_evidence_digest text,p_external_reference text
) RETURNS TABLE(applied boolean,state text,reason text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,geoapify_disposable AS $$
BEGIN
 RETURN QUERY SELECT false,NULL::text,'EXECUTOR_NOT_ACTIVATED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text) FROM PUBLIC;
ALTER FUNCTION geoapify_disposable.reviewer_attest_guarded(uuid,text,text,text,text) OWNER TO ed_reconcile_executor;
ALTER FUNCTION geoapify_disposable.reviewer_reconcile_guarded(uuid,text,text,text,text) OWNER TO ed_reconcile_executor;
REVOKE CREATE ON SCHEMA geoapify_disposable FROM ed_reconcile_executor;
-- Nobody receives EXECUTE on wrappers; reviewer logins receive NO table DML.
COMMIT;
