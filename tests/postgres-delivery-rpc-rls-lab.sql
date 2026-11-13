-- Disposable PostgreSQL 16 ONLY. No Supabase, no real customer/order objects.
-- Laboratory identities are PostgreSQL roles, never client-supplied actor IDs.
BEGIN;
CREATE ROLE ed_lab_gestor_a NOLOGIN;
CREATE ROLE ed_lab_gestor_b NOLOGIN;
CREATE ROLE ed_lab_admin NOLOGIN;
CREATE ROLE ed_lab_supervisor NOLOGIN;
CREATE ROLE ed_lab_rpc_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE SCHEMA ed_rpc_lab;
REVOKE ALL ON SCHEMA ed_rpc_lab FROM PUBLIC;
CREATE TABLE ed_rpc_lab.carts(
 cart_id text PRIMARY KEY, manager_role name NOT NULL, customer_id text NOT NULL,
 revision bigint NOT NULL CHECK(revision>0), subtotal_usd numeric(12,2) NOT NULL CHECK(subtotal_usd>=0)
);
CREATE TABLE ed_rpc_lab.routes(
 cart_id text PRIMARY KEY REFERENCES ed_rpc_lab.carts(cart_id),
 cart_revision bigint NOT NULL, distance_km numeric(10,2) NOT NULL CHECK(distance_km>=0),
 route_version bigint NOT NULL CHECK(route_version>0), source text NOT NULL CHECK(source='server_fixture'),
 expires_at timestamptz NOT NULL
);
CREATE TABLE ed_rpc_lab.settings(
 singleton boolean PRIMARY KEY CHECK(singleton), version bigint NOT NULL CHECK(version>0),
 rate_cup_per_km numeric(12,2) NOT NULL CHECK(rate_cup_per_km>0),
 min_km numeric(10,2) NOT NULL CHECK(min_km>=0),
 min_fee_cup bigint NOT NULL CHECK(min_fee_cup>=0),
 free_threshold_usd numeric(12,2) NOT NULL CHECK(free_threshold_usd>0)
);
CREATE TABLE ed_rpc_lab.quotes(
 actor_role name NOT NULL, operation_key text NOT NULL,
 payload_hash text NOT NULL, cart_id text NOT NULL, cart_revision bigint NOT NULL,
 settings_version bigint NOT NULL, route_version bigint NOT NULL,
 gross_cup bigint NOT NULL, customer_cup bigint NOT NULL, covered_cup bigint NOT NULL,
 PRIMARY KEY(actor_role,operation_key),
 CHECK(gross_cup=customer_cup+covered_cup)
);
CREATE TABLE ed_rpc_lab.audit(
 version bigint PRIMARY KEY, actor_role name NOT NULL, reason text NOT NULL,
 previous_rate numeric(12,2) NOT NULL, next_rate numeric(12,2) NOT NULL,
 at_time timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO ed_rpc_lab.carts VALUES
 ('cart-a','ed_lab_gestor_a','customer-a',1,50),
 ('cart-b','ed_lab_gestor_b','customer-b',1,220);
INSERT INTO ed_rpc_lab.routes VALUES
 ('cart-a',1,5,1,'server_fixture',clock_timestamp()+interval '1 hour'),
 ('cart-b',1,8,1,'server_fixture',clock_timestamp()+interval '1 hour');
INSERT INTO ed_rpc_lab.settings VALUES(true,1,200,3,600,200);

-- RLS is actually enforced on direct read operations by non-owner roles.
ALTER TABLE ed_rpc_lab.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.carts FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.quotes FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.audit FORCE ROW LEVEL SECURITY;
CREATE POLICY carts_own ON ed_rpc_lab.carts FOR SELECT
 USING(manager_role=current_setting('role')::name OR current_setting('role')='ed_lab_admin');
CREATE POLICY quotes_own ON ed_rpc_lab.quotes FOR SELECT
 USING(actor_role=current_setting('role')::name);
CREATE POLICY audit_admin ON ed_rpc_lab.audit FOR SELECT
 USING(current_setting('role')='ed_lab_admin');

-- Dedicated SECURITY DEFINER owner without BYPASSRLS; all tables FORCE RLS.
-- PostgreSQL-managed SET ROLE is the lab's invoker identity, not a custom GUC.
CREATE FUNCTION ed_rpc_lab.quote_preview(
 p_key text,p_cart text,p_customer text,p_revision bigint
) RETURNS TABLE(result text,gross bigint,customer_fee bigint,promo_coverage bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_rpc_lab AS $func$
DECLARE actor name; c ed_rpc_lab.carts%ROWTYPE; r ed_rpc_lab.routes%ROWTYPE;
 s ed_rpc_lab.settings%ROWTYPE; existing ed_rpc_lab.quotes%ROWTYPE;
 digest text; gross_value bigint; fee_value bigint;
BEGIN
 actor=current_setting('role')::name;
 IF actor NOT IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin') THEN
  RAISE EXCEPTION 'forbidden_role' USING ERRCODE='42501';
 END IF;
 IF p_key IS NULL OR length(p_key) NOT BETWEEN 1 AND 80 OR
    p_cart IS NULL OR p_customer IS NULL OR p_revision IS NULL THEN
  RAISE EXCEPTION 'invalid_request' USING ERRCODE='22023';
 END IF;
 -- Serialize rate edits and quote commits; do not trust caller-supplied money/route.
 SELECT * INTO s FROM ed_rpc_lab.settings WHERE singleton=true FOR SHARE;
 SELECT * INTO c FROM ed_rpc_lab.carts WHERE cart_id=p_cart FOR SHARE;
 IF NOT FOUND OR (actor<>'ed_lab_admin' AND c.manager_role<>actor)
    OR c.customer_id<>p_customer THEN
  RAISE EXCEPTION 'not_accessible' USING ERRCODE='42501';
 END IF;
 IF c.revision<>p_revision THEN RAISE EXCEPTION 'stale_cart' USING ERRCODE='40001'; END IF;
 SELECT * INTO r FROM ed_rpc_lab.routes WHERE cart_id=p_cart FOR SHARE;
 IF NOT FOUND OR r.cart_revision<>c.revision OR r.source<>'server_fixture'
    OR r.expires_at<=clock_timestamp() THEN
  RAISE EXCEPTION 'stale_route' USING ERRCODE='40001';
 END IF;
 digest=md5(p_cart||':'||p_customer||':'||p_revision::text);
 SELECT * INTO existing FROM ed_rpc_lab.quotes WHERE actor_role=actor AND operation_key=p_key FOR UPDATE;
 IF FOUND THEN
  IF existing.payload_hash<>digest THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23505'; END IF;
  IF existing.settings_version<>s.version OR existing.route_version<>r.route_version
     OR existing.cart_revision<>c.revision THEN
   RAISE EXCEPTION 'stale_quote' USING ERRCODE='40001';
  END IF;
  RETURN QUERY SELECT 'replayed'::text,existing.gross_cup,existing.customer_cup,existing.covered_cup;
  RETURN;
 END IF;
 gross_value=CEIL(GREATEST(r.distance_km,s.min_km)*s.rate_cup_per_km)::bigint;
 gross_value=GREATEST(gross_value,s.min_fee_cup);
 fee_value=CASE WHEN c.subtotal_usd>=s.free_threshold_usd THEN 0 ELSE gross_value END;
 INSERT INTO ed_rpc_lab.quotes(actor_role,operation_key,payload_hash,cart_id,cart_revision,
 settings_version,route_version,gross_cup,customer_cup,covered_cup)
 VALUES(actor,p_key,digest,p_cart,c.revision,s.version,r.route_version,
 gross_value,fee_value,gross_value-fee_value)
 ON CONFLICT (actor_role,operation_key) DO NOTHING;
 SELECT * INTO existing FROM ed_rpc_lab.quotes WHERE actor_role=actor AND operation_key=p_key FOR UPDATE;
 IF existing.payload_hash<>digest THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23505'; END IF;
 RETURN QUERY SELECT 'committed'::text,existing.gross_cup,existing.customer_cup,existing.covered_cup;
END $func$;

CREATE FUNCTION ed_rpc_lab.update_rate(p_expected bigint,p_new numeric,p_reason text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_rpc_lab AS $func$
DECLARE actor name; old_rate numeric; new_version bigint;
BEGIN
 actor=current_setting('role')::name;
 IF actor<>'ed_lab_admin' THEN RAISE EXCEPTION 'forbidden_role' USING ERRCODE='42501'; END IF;
 IF p_expected IS NULL OR p_new IS NULL OR p_new<=0 OR p_new>100000
    OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 160 THEN
  RAISE EXCEPTION 'invalid_change' USING ERRCODE='22023';
 END IF;
 SELECT rate_cup_per_km INTO old_rate FROM ed_rpc_lab.settings WHERE singleton=true AND version=p_expected FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='40001'; END IF;
 UPDATE ed_rpc_lab.settings SET version=version+1,rate_cup_per_km=p_new
 WHERE singleton=true RETURNING version INTO new_version;
 INSERT INTO ed_rpc_lab.audit(version,actor_role,reason,previous_rate,next_rate)
 VALUES(new_version,actor,p_reason,old_rate,p_new);
 RETURN new_version;
END $func$;

REVOKE ALL ON ALL TABLES IN SCHEMA ed_rpc_lab FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ed_rpc_lab FROM PUBLIC;

-- FORCE RLS on every table touched by the RPC, including internal settings.
ALTER TABLE ed_rpc_lab.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.routes FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.settings FORCE ROW LEVEL SECURITY;
CREATE POLICY routes_rpc_read ON ed_rpc_lab.routes FOR SELECT TO ed_lab_rpc_owner
 USING(EXISTS (SELECT 1 FROM ed_rpc_lab.carts c
               WHERE c.cart_id=routes.cart_id
                 AND (c.manager_role=current_setting('role')::name OR current_setting('role')='ed_lab_admin')));
CREATE POLICY settings_rpc_read ON ed_rpc_lab.settings FOR SELECT TO ed_lab_rpc_owner
 USING(current_setting('role') IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin'));
CREATE POLICY settings_rpc_update ON ed_rpc_lab.settings FOR UPDATE TO ed_lab_rpc_owner
 USING(current_setting('role')='ed_lab_admin')
 WITH CHECK(current_setting('role')='ed_lab_admin');
CREATE POLICY quotes_rpc_insert ON ed_rpc_lab.quotes FOR INSERT TO ed_lab_rpc_owner
 WITH CHECK(actor_role=current_setting('role')::name
            AND current_setting('role') IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin'));
CREATE POLICY quotes_rpc_update ON ed_rpc_lab.quotes FOR UPDATE TO ed_lab_rpc_owner
 USING(actor_role=current_setting('role')::name)
 WITH CHECK(actor_role=current_setting('role')::name);
CREATE POLICY audit_rpc_insert ON ed_rpc_lab.audit FOR INSERT TO ed_lab_rpc_owner
 WITH CHECK(current_setting('role')='ed_lab_admin' AND actor_role='ed_lab_admin');
GRANT USAGE ON SCHEMA ed_rpc_lab TO ed_lab_rpc_owner;
GRANT SELECT ON ed_rpc_lab.carts,ed_rpc_lab.routes,ed_rpc_lab.settings,ed_rpc_lab.quotes
 TO ed_lab_rpc_owner;
GRANT INSERT ON ed_rpc_lab.quotes,ed_rpc_lab.audit TO ed_lab_rpc_owner;
GRANT UPDATE ON ed_rpc_lab.settings,ed_rpc_lab.quotes TO ed_lab_rpc_owner;
ALTER FUNCTION ed_rpc_lab.quote_preview(text,text,text,bigint) OWNER TO ed_lab_rpc_owner;
ALTER FUNCTION ed_rpc_lab.update_rate(bigint,numeric,text) OWNER TO ed_lab_rpc_owner;

GRANT USAGE ON SCHEMA ed_rpc_lab TO ed_lab_gestor_a,ed_lab_gestor_b,ed_lab_admin,ed_lab_supervisor;
GRANT SELECT ON ed_rpc_lab.carts,ed_rpc_lab.quotes TO ed_lab_gestor_a,ed_lab_gestor_b,ed_lab_admin;
GRANT SELECT ON ed_rpc_lab.audit TO ed_lab_admin;
GRANT EXECUTE ON FUNCTION ed_rpc_lab.quote_preview(text,text,text,bigint) TO ed_lab_gestor_a,ed_lab_gestor_b,ed_lab_admin;
GRANT EXECUTE ON FUNCTION ed_rpc_lab.update_rate(bigint,numeric,text) TO ed_lab_admin;
COMMIT;
