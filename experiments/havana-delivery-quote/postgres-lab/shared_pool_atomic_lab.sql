-- DISPOSABLE POSTGRESQL ONLY. Prototype atomic linkage; NOT authorization for checkout.
-- Prerequisite: shared_pool_intents.sql and manual_approval.sql.
-- DBA must ensure this function owner has explicit privileges; no pool direct table access.
BEGIN;
CREATE TABLE ed_delivery_intent_lab.authoritative_context (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[0-9a-f]{64}$'),
 revision bigint NOT NULL CHECK(revision>=0)
);
CREATE TABLE ed_delivery_intent_lab.admin_roles (
 actor_id text PRIMARY KEY,
 role text NOT NULL CHECK(role IN ('principal','general','supervisor','gestor')),
 enabled boolean NOT NULL DEFAULT false
);
REVOKE ALL ON ed_delivery_intent_lab.authoritative_context,ed_delivery_intent_lab.admin_roles FROM PUBLIC,ed_intent_pool,ed_intent_gateway;
GRANT SELECT ON ed_delivery_intent_lab.authoritative_context,ed_delivery_intent_lab.admin_roles TO ed_intent_owner;
GRANT SELECT,INSERT,UPDATE ON ed_delivery_lab.approvals TO ed_intent_owner;
GRANT USAGE ON SCHEMA ed_delivery_lab TO ed_intent_owner;
GRANT USAGE ON SEQUENCE ed_delivery_lab.approvals_id_seq TO ed_intent_owner;
CREATE FUNCTION ed_delivery_intent_lab.apply_intent(p_intent_id bigint,p_nonce_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v ed_delivery_intent_lab.intents%ROWTYPE; c record; r text; old_row ed_delivery_lab.approvals%ROWTYPE;
BEGIN
 IF p_intent_id IS NULL OR p_nonce_hash IS NULL OR p_nonce_hash !~ '^[0-9a-f]{64}$'
 THEN RETURN 'PENDIENTE'; END IF;
 -- All paths lock context first, then intent, then approval; no intermediate commit.
 SELECT fingerprint,revision INTO c FROM ed_delivery_intent_lab.authoritative_context WHERE singleton FOR SHARE;
 IF NOT FOUND THEN RETURN 'PENDIENTE'; END IF;
 SELECT * INTO v FROM ed_delivery_intent_lab.intents WHERE intent_id=p_intent_id FOR UPDATE;
 IF NOT FOUND OR v.nonce_hash<>p_nonce_hash OR v.consumed_at IS NOT NULL
 OR v.expires_at<=clock_timestamp() OR v.issued_at>clock_timestamp()
 OR v.audience<>'havana-delivery-admin'
 OR c.fingerprint<>v.context_hash OR c.revision<>v.context_revision
 THEN RETURN 'PENDIENTE'; END IF;
 SELECT role INTO r FROM ed_delivery_intent_lab.admin_roles WHERE actor_id=v.actor_id AND enabled FOR SHARE;
 IF r IS NULL OR r NOT IN ('principal','general') THEN RETURN 'PENDIENTE'; END IF;
 IF v.action='approve' THEN
  SELECT * INTO old_row FROM ed_delivery_lab.approvals
  WHERE actor_id=v.actor_id AND operation_id=v.operation_id FOR UPDATE;
  IF FOUND THEN
   IF old_row.request_fingerprint<>v.context_hash OR old_row.configuration_revision<>v.context_revision
   OR old_row.fee_cup<>v.fee_cup OR old_row.revoked_at IS NOT NULL OR old_row.expires_at<=clock_timestamp()
   THEN RETURN 'PENDIENTE'; END IF;
   -- Existing identical operation: do not duplicate approval.
  ELSE
   INSERT INTO ed_delivery_lab.approvals(actor_id,operation_id,request_fingerprint,configuration_revision,fee_cup,expires_at)
   VALUES(v.actor_id,v.operation_id,v.context_hash,v.context_revision,v.fee_cup,v.expires_at);
  END IF;
 ELSIF v.action='revoke' THEN
  SELECT * INTO old_row FROM ed_delivery_lab.approvals WHERE id=v.target_approval_id FOR UPDATE;
  IF NOT FOUND OR old_row.request_fingerprint<>v.context_hash OR old_row.configuration_revision<>v.context_revision
  THEN RETURN 'PENDIENTE'; END IF;
  UPDATE ed_delivery_lab.approvals SET revoked_at=clock_timestamp()
  WHERE id=v.target_approval_id AND revoked_at IS NULL;
 ELSE
  RETURN 'PENDIENTE';
 END IF;
 UPDATE ed_delivery_intent_lab.intents SET consumed_at=clock_timestamp() WHERE intent_id=p_intent_id;
 RETURN 'LAB_APPLIED_ONLY';
END $$;
ALTER FUNCTION ed_delivery_intent_lab.apply_intent(bigint,text) OWNER TO ed_intent_owner;
REVOKE ALL ON FUNCTION ed_delivery_intent_lab.apply_intent(bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ed_delivery_intent_lab.apply_intent(bigint,text) TO ed_intent_pool;
COMMIT;
