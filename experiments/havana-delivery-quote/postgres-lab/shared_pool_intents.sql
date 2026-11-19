-- OFFLINE PROTOTYPE ONLY. Disposable PostgreSQL; NOT production authorization.
-- Execute as disposable DBA. Gateway writer and pool reader MUST use separate credentials.
BEGIN;
CREATE SCHEMA ed_delivery_intent_lab;
REVOKE ALL ON SCHEMA ed_delivery_intent_lab FROM PUBLIC;
CREATE ROLE ed_intent_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE ed_intent_gateway NOLOGIN NOBYPASSRLS;
CREATE ROLE ed_intent_pool NOLOGIN NOBYPASSRLS;
CREATE TABLE ed_delivery_intent_lab.intents (
 intent_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nonce_hash text NOT NULL UNIQUE CHECK(nonce_hash ~ '^[0-9a-f]{64}$'),
 actor_id text NOT NULL CHECK(length(actor_id)>0),
 operation_id text NOT NULL CHECK(length(operation_id)>0),
 action text NOT NULL CHECK(action IN ('approve','revoke')),
 audience text NOT NULL CHECK(audience='havana-delivery-admin'),
 context_hash text NOT NULL CHECK(context_hash ~ '^[0-9a-f]{64}$'),
 context_revision bigint NOT NULL CHECK(context_revision>=0),
 fee_cup bigint CHECK(fee_cup>=0),
 target_approval_id bigint,
 issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 CHECK(expires_at>issued_at),
 CHECK((action='approve' AND fee_cup IS NOT NULL AND target_approval_id IS NULL)
    OR (action='revoke' AND fee_cup IS NULL AND target_approval_id IS NOT NULL)),
 UNIQUE(actor_id,operation_id,action)
);
-- A gateway writer is a separately authenticated service identity; it must validate
-- administrator session and canonical context BEFORE writing. SQL cannot prove this.
GRANT USAGE ON SCHEMA ed_delivery_intent_lab TO ed_intent_gateway,ed_intent_pool,ed_intent_owner;
GRANT INSERT ON ed_delivery_intent_lab.intents TO ed_intent_gateway;
GRANT USAGE ON SEQUENCE ed_delivery_intent_lab.intents_intent_id_seq TO ed_intent_gateway;
-- Pool receives NO direct table privileges, NO gateway membership, NO CREATE.
REVOKE ALL ON ed_delivery_intent_lab.intents FROM PUBLIC,ed_intent_pool;
REVOKE CREATE ON SCHEMA ed_delivery_intent_lab FROM PUBLIC,ed_intent_gateway,ed_intent_pool;
GRANT SELECT,UPDATE(consumed_at) ON ed_delivery_intent_lab.intents TO ed_intent_owner;
CREATE FUNCTION ed_delivery_intent_lab.consume(p_intent_id bigint,p_nonce_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v ed_delivery_intent_lab.intents%ROWTYPE;
BEGIN
 IF p_intent_id IS NULL OR p_nonce_hash IS NULL OR p_nonce_hash !~ '^[0-9a-f]{64}$' THEN RETURN 'PENDIENTE'; END IF;
 SELECT * INTO v FROM ed_delivery_intent_lab.intents WHERE intent_id=p_intent_id FOR UPDATE;
 IF NOT FOUND OR v.nonce_hash<>p_nonce_hash OR v.consumed_at IS NOT NULL
 OR v.expires_at<=clock_timestamp() OR v.issued_at>clock_timestamp()
 OR v.audience<>'havana-delivery-admin' THEN RETURN 'PENDIENTE'; END IF;
 -- IMPORTANT: no approval/revocation is performed here; consumption is NOT authorization.
 UPDATE ed_delivery_intent_lab.intents SET consumed_at=clock_timestamp() WHERE intent_id=p_intent_id;
 RETURN 'LAB_CONSUMED_ONLY';
END $$;
ALTER FUNCTION ed_delivery_intent_lab.consume(bigint,text) OWNER TO ed_intent_owner;
REVOKE ALL ON FUNCTION ed_delivery_intent_lab.consume(bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ed_delivery_intent_lab.consume(bigint,text) TO ed_intent_pool;
-- Gateway cannot consume; pool cannot create or modify intent rows directly.
COMMIT;
