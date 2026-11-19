-- LAB ONLY. Requires prior manual_approval.sql in disposable PostgreSQL.
-- Actor identity is PostgreSQL session_user, NOT a caller-controlled GUC.\n-- Each test login must be a distinct PostgreSQL LOGIN role; never expose SQL login to browser.
BEGIN;
CREATE TABLE ed_delivery_lab.actor_grants (
 actor_id text PRIMARY KEY, role text NOT NULL CHECK(role IN ('principal','general','supervisor','gestor')),
 enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE ed_delivery_lab.context_state (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[0-9a-f]{64}$'),
 configuration_revision bigint NOT NULL CHECK(configuration_revision>=0)
);
-- Context fingerprint must be recomputed and written by trusted server from cart/destination/origins/rules.
-- Grant API membership to authenticated PostgreSQL LOGIN roles only in disposable lab.\n-- SECURITY DEFINER must be owned by a dedicated non-login technical owner in a future deployment.
-- Prerequisite: create ed_delivery_lab_api NOLOGIN once as database owner.\n-- This script does not create login roles or passwords.
-- Only DBA-controlled login grants may execute RPCs.\nGRANT USAGE ON SCHEMA ed_delivery_lab TO ed_delivery_lab_api,ed_delivery_lab_owner;
REVOKE ALL ON ed_delivery_lab.actor_grants,ed_delivery_lab.context_state,ed_delivery_lab.approvals FROM PUBLIC,ed_delivery_lab_api;\nREVOKE CREATE ON SCHEMA ed_delivery_lab FROM PUBLIC,ed_delivery_lab_api;\n-- Technical definer requires explicit SELECT/INSERT/UPDATE; no BYPASSRLS or LOGIN.\nGRANT SELECT ON ed_delivery_lab.actor_grants,ed_delivery_lab.context_state,ed_delivery_lab.approvals TO ed_delivery_lab_owner;\nGRANT INSERT,UPDATE ON ed_delivery_lab.approvals TO ed_delivery_lab_owner;\nGRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA ed_delivery_lab TO ed_delivery_lab_owner;
-- Explicit definer owner is set after creation, in same DBA transaction.\nCREATE OR REPLACE FUNCTION ed_delivery_lab.approve(p_operation text,p_fee bigint,p_expected_fingerprint text,p_expected_revision bigint)
RETURNS TABLE(result text, approval_id bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_delivery_lab AS $$
DECLARE v_actor text; v_role text; v_context record; v_old ed_delivery_lab.approvals%ROWTYPE;
BEGIN
 v_actor:=session_user;
 -- session_user is set by PostgreSQL authentication and not by SQL SET ROLE.
 IF v_actor IS NULL OR p_operation IS NULL OR length(p_operation)=0 OR p_fee IS NULL OR p_fee<0
 OR p_expected_fingerprint IS NULL OR p_expected_fingerprint !~ '^[0-9a-f]{64}$'
 OR p_expected_revision IS NULL THEN
  RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN;
 END IF;
 SELECT a.role INTO v_role FROM ed_delivery_lab.actor_grants a WHERE a.actor_id=v_actor AND a.enabled FOR SHARE;
 IF v_role IS NULL OR v_role NOT IN ('principal','general') THEN
  RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN;
 END IF;
 SELECT c.fingerprint,c.configuration_revision INTO v_context FROM ed_delivery_lab.context_state c WHERE c.singleton FOR UPDATE;
 IF NOT FOUND OR v_context.fingerprint<>p_expected_fingerprint OR v_context.configuration_revision<>p_expected_revision THEN
  RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN;
 END IF;
 -- Unique actor+operation, serialized under context row lock. No mutation of an old approval.
 SELECT * INTO v_old FROM ed_delivery_lab.approvals a WHERE a.actor_id=v_actor AND a.operation_id=p_operation FOR UPDATE;
 IF FOUND THEN
  IF v_old.request_fingerprint<>p_expected_fingerprint OR v_old.configuration_revision<>p_expected_revision OR v_old.fee_cup<>p_fee THEN
   RETURN QUERY SELECT 'CONFLICT'::text,NULL::bigint; RETURN;
  END IF;
  IF v_old.revoked_at IS NOT NULL OR v_old.expires_at<=clock_timestamp() THEN
   RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN;
  END IF;
  RETURN QUERY SELECT 'EXISTING'::text,v_old.id; RETURN;
 END IF;
 INSERT INTO ed_delivery_lab.approvals(actor_id,operation_id,request_fingerprint,configuration_revision,fee_cup,expires_at)
 VALUES(v_actor,p_operation,p_expected_fingerprint,p_expected_revision,p_fee,clock_timestamp()+interval '15 minutes')
 RETURNING id INTO approval_id;
 result:='CREATED'; RETURN NEXT;
END $$;
CREATE OR REPLACE FUNCTION ed_delivery_lab.revoke(p_id bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_delivery_lab AS $$
DECLARE v_actor text; v_role text; v_old ed_delivery_lab.approvals%ROWTYPE;
BEGIN
 v_actor:=session_user;
 SELECT a.role INTO v_role FROM ed_delivery_lab.actor_grants a WHERE a.actor_id=v_actor AND a.enabled FOR SHARE;
 IF v_role IS NULL OR v_role NOT IN ('principal','general') THEN RETURN 'PENDIENTE'; END IF;
 SELECT * INTO v_old FROM ed_delivery_lab.approvals a WHERE a.id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'PENDIENTE'; END IF;
 UPDATE ed_delivery_lab.approvals SET revoked_at=clock_timestamp()
 WHERE id=p_id AND revoked_at IS NULL;
 RETURN 'REVOKED';
END $$;
CREATE OR REPLACE FUNCTION ed_delivery_lab.resolve(p_id bigint)
RETURNS TABLE(result text, fee_cup bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_delivery_lab AS $$
DECLARE v_old ed_delivery_lab.approvals%ROWTYPE; v_ctx record; v_role text;
BEGIN
 -- Lock order matches approve: context first, then approval, to avoid inversion.
 SELECT c.fingerprint,c.configuration_revision INTO v_ctx FROM ed_delivery_lab.context_state c WHERE c.singleton FOR SHARE;
 IF NOT FOUND THEN RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN; END IF;
 SELECT * INTO v_old FROM ed_delivery_lab.approvals a WHERE a.id=p_id FOR SHARE;
 IF NOT FOUND THEN RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN; END IF;
 SELECT a.role INTO v_role FROM ed_delivery_lab.actor_grants a WHERE a.actor_id=v_old.actor_id AND a.enabled FOR SHARE;
 IF v_old.revoked_at IS NOT NULL OR v_old.expires_at<=clock_timestamp()
 OR v_role IS NULL OR v_role NOT IN ('principal','general')
 OR v_ctx.fingerprint IS DISTINCT FROM v_old.request_fingerprint
 OR v_ctx.configuration_revision IS DISTINCT FROM v_old.configuration_revision THEN
  RETURN QUERY SELECT 'PENDIENTE'::text,NULL::bigint; RETURN;
 END IF;
 RETURN QUERY SELECT 'LAB_VALID_ONLY'::text,v_old.fee_cup;
END $$;
ALTER FUNCTION ed_delivery_lab.approve(text,bigint,text,bigint) OWNER TO ed_delivery_lab_owner;\nALTER FUNCTION ed_delivery_lab.revoke(bigint) OWNER TO ed_delivery_lab_owner;\nALTER FUNCTION ed_delivery_lab.resolve(bigint) OWNER TO ed_delivery_lab_owner;\nREVOKE ALL ON FUNCTION ed_delivery_lab.approve(text,bigint,text,bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION ed_delivery_lab.revoke(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION ed_delivery_lab.resolve(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ed_delivery_lab.approve(text,bigint,text,bigint) TO ed_delivery_lab_api;
GRANT EXECUTE ON FUNCTION ed_delivery_lab.revoke(bigint) TO ed_delivery_lab_api;
GRANT EXECUTE ON FUNCTION ed_delivery_lab.resolve(bigint) TO ed_delivery_lab_api;
COMMIT;
