-- Disposable PostgreSQL 16 ONLY. No Supabase, no real customer/order objects.
-- Laboratory identities are PostgreSQL roles, never client-supplied actor IDs.
BEGIN;
CREATE ROLE ed_lab_gestor_a LOGIN PASSWORD 'disposable-lab-only';
CREATE ROLE ed_lab_gestor_b LOGIN PASSWORD 'disposable-lab-only';
CREATE ROLE ed_lab_admin LOGIN PASSWORD 'disposable-lab-only';
CREATE ROLE ed_lab_supervisor LOGIN PASSWORD 'disposable-lab-only';
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


ALTER TABLE ed_rpc_lab.carts ADD COLUMN destination_version bigint NOT NULL DEFAULT 1 CHECK(destination_version>0);
ALTER TABLE ed_rpc_lab.routes ADD COLUMN destination_version bigint NOT NULL DEFAULT 1 CHECK(destination_version>0);
ALTER TABLE ed_rpc_lab.routes ADD COLUMN warehouse_version bigint NOT NULL DEFAULT 1 CHECK(warehouse_version>0);
ALTER TABLE ed_rpc_lab.quotes ADD COLUMN destination_version bigint NOT NULL DEFAULT 1 CHECK(destination_version>0);
ALTER TABLE ed_rpc_lab.quotes ADD COLUMN warehouse_version bigint NOT NULL DEFAULT 1 CHECK(warehouse_version>0);
CREATE TABLE ed_rpc_lab.warehouses(singleton boolean PRIMARY KEY CHECK(singleton),version bigint NOT NULL CHECK(version>0));
INSERT INTO ed_rpc_lab.warehouses VALUES(true,1);
CREATE TABLE ed_rpc_lab.context_audit(
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_role name NOT NULL, change_kind text NOT NULL, cart_id text,
 previous_version bigint NOT NULL, next_version bigint NOT NULL,
 at_time timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- RLS is actually enforced on direct read operations by non-owner roles.
ALTER TABLE ed_rpc_lab.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.carts FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.quotes FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.audit FORCE ROW LEVEL SECURITY;
CREATE POLICY carts_own ON ed_rpc_lab.carts FOR SELECT
 USING(manager_role=session_user::name OR session_user='ed_lab_admin');
CREATE POLICY quotes_own ON ed_rpc_lab.quotes FOR SELECT
 USING(actor_role=session_user::name);
CREATE POLICY audit_admin ON ed_rpc_lab.audit FOR SELECT
 USING(session_user='ed_lab_admin');

-- Dedicated SECURITY DEFINER owner without BYPASSRLS; all tables FORCE RLS.
-- session_user is the authenticated login role, preserved across SECURITY DEFINER.
-- All passwords here are disposable fixtures, never production credentials.
CREATE FUNCTION ed_rpc_lab.quote_preview(
 p_key text,p_cart text,p_customer text,p_revision bigint
) RETURNS TABLE(result text,gross bigint,customer_fee bigint,promo_coverage bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_rpc_lab AS $func$
DECLARE actor name; c ed_rpc_lab.carts%ROWTYPE; r ed_rpc_lab.routes%ROWTYPE;
 s ed_rpc_lab.settings%ROWTYPE; existing ed_rpc_lab.quotes%ROWTYPE;
 digest text; gross_value bigint; fee_value bigint; w ed_rpc_lab.warehouses%ROWTYPE;
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'unsupported_isolation' USING ERRCODE='0A000';
 END IF;
 actor=session_user::name;
 IF actor NOT IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin') THEN
  RAISE EXCEPTION 'forbidden_role' USING ERRCODE='42501';
 END IF;
 IF p_key IS NULL OR length(p_key) NOT BETWEEN 1 AND 80 OR p_key ~ '[[:cntrl:]]' OR position(chr(8232) in p_key)>0 OR position(chr(8233) in p_key)>0 OR btrim(translate(p_key, chr(160) || chr(8239) || chr(12288) || chr(8203) || chr(8288) || chr(65279), '      '), ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13))='' OR
    p_cart IS NULL OR p_customer IS NULL OR p_revision IS NULL THEN
  RAISE EXCEPTION 'invalid_request' USING ERRCODE='22023';
 END IF;
 -- Serialize rate edits and quote commits; do not trust caller-supplied money/route.
 -- Cart/route SELECT is read-only: FOR SHARE would require UPDATE privileges.
 -- Cart/route concurrent mutation still needs a versioned transactional contract.
 PERFORM pg_catalog.pg_advisory_xact_lock_shared(917321);
 PERFORM pg_catalog.pg_advisory_xact_lock_shared(917322);
 PERFORM pg_catalog.pg_advisory_xact_lock_shared(917323,pg_catalog.hashtext(p_cart));
 SELECT * INTO s FROM ed_rpc_lab.settings WHERE singleton=true;
 SELECT * INTO c FROM ed_rpc_lab.carts WHERE cart_id=p_cart;
 IF NOT FOUND OR (actor<>'ed_lab_admin' AND c.manager_role<>actor)
    OR c.customer_id<>p_customer THEN
  RAISE EXCEPTION 'not_accessible' USING ERRCODE='42501';
 END IF;
 IF c.revision<>p_revision THEN RAISE EXCEPTION 'stale_cart' USING ERRCODE='40001'; END IF;
 SELECT * INTO w FROM ed_rpc_lab.warehouses WHERE singleton=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'missing_warehouse' USING ERRCODE='40001'; END IF;
 SELECT * INTO r FROM ed_rpc_lab.routes WHERE cart_id=p_cart;
 IF NOT FOUND OR r.cart_revision<>c.revision OR r.destination_version<>c.destination_version
    OR r.warehouse_version<>w.version OR r.source<>'server_fixture'
    OR r.expires_at<=clock_timestamp() THEN
  RAISE EXCEPTION 'stale_route' USING ERRCODE='40001';
 END IF;
 digest=md5(jsonb_build_array(p_cart,p_customer,p_revision)::text);
 SELECT * INTO existing FROM ed_rpc_lab.quotes WHERE actor_role=actor AND operation_key=p_key FOR UPDATE;
 IF FOUND THEN
  IF existing.payload_hash<>digest THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23505'; END IF;
  IF existing.settings_version<>s.version OR existing.route_version<>r.route_version
     OR existing.cart_revision<>c.revision
     OR existing.destination_version<>c.destination_version
     OR existing.warehouse_version<>w.version THEN
   RAISE EXCEPTION 'stale_quote' USING ERRCODE='40001';
  END IF;
  IF r.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'expired_route' USING ERRCODE='40001'; END IF;
  RETURN QUERY SELECT 'replayed'::text,existing.gross_cup,existing.customer_cup,existing.covered_cup;
  RETURN;
 END IF;
 gross_value=CEIL(GREATEST(r.distance_km,s.min_km)*s.rate_cup_per_km)::bigint;
 gross_value=GREATEST(gross_value,s.min_fee_cup);
 fee_value=CASE WHEN c.subtotal_usd>=s.free_threshold_usd THEN 0 ELSE gross_value END;
 INSERT INTO ed_rpc_lab.quotes(actor_role,operation_key,payload_hash,cart_id,cart_revision,
 settings_version,route_version,gross_cup,customer_cup,covered_cup,
 destination_version,warehouse_version)
 VALUES(actor,p_key,digest,p_cart,c.revision,s.version,r.route_version,
 gross_value,fee_value,gross_value-fee_value,c.destination_version,w.version)
 ON CONFLICT (actor_role,operation_key) DO NOTHING;
 SELECT * INTO existing FROM ed_rpc_lab.quotes WHERE actor_role=actor AND operation_key=p_key FOR UPDATE;
 IF existing.payload_hash<>digest THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23505'; END IF;
 -- A concurrent session may have won the same operation key on a different cart.
 -- Never return its fee without checking the full context snapshot.
 IF existing.cart_id<>p_cart OR existing.cart_revision<>c.revision
    OR existing.settings_version<>s.version OR existing.route_version<>r.route_version
    OR existing.destination_version<>c.destination_version
    OR existing.warehouse_version<>w.version THEN
   RAISE EXCEPTION 'stale_quote' USING ERRCODE='40001';
 END IF;
 IF r.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'expired_route' USING ERRCODE='40001'; END IF;
 RETURN QUERY SELECT 'committed'::text,existing.gross_cup,existing.customer_cup,existing.covered_cup;
END $func$;

CREATE FUNCTION ed_rpc_lab.update_rate(p_expected bigint,p_new numeric,p_reason text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_rpc_lab AS $func$
DECLARE actor name; old_rate numeric; new_version bigint;
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'unsupported_isolation' USING ERRCODE='0A000';
 END IF;
 actor=session_user::name;
 IF actor<>'ed_lab_admin' THEN RAISE EXCEPTION 'forbidden_role' USING ERRCODE='42501'; END IF;
 IF p_expected IS NULL OR p_new IS NULL OR p_new<=0 OR p_new>100000
    OR p_reason IS NULL OR p_reason ~ '[[:cntrl:]]' OR position(chr(8232) in p_reason)>0 OR position(chr(8233) in p_reason)>0 OR length(p_reason)>160 OR length(btrim(translate(p_reason, chr(160) || chr(8239) || chr(12288) || chr(8203) || chr(8288) || chr(65279), '      '), ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13))) NOT BETWEEN 3 AND 160 THEN
  RAISE EXCEPTION 'invalid_change' USING ERRCODE='22023';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(917321);
 SELECT rate_cup_per_km INTO old_rate FROM ed_rpc_lab.settings WHERE singleton=true AND version=p_expected FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='40001'; END IF;
 UPDATE ed_rpc_lab.settings SET version=version+1,rate_cup_per_km=p_new
 WHERE singleton=true RETURNING version INTO new_version;
 INSERT INTO ed_rpc_lab.audit(version,actor_role,reason,previous_rate,next_rate)
 VALUES(new_version,actor,p_reason,old_rate,p_new);
 RETURN new_version;
END $func$;


-- Synthetic admin-only context mutation. Lock order tariff -> warehouse -> cart.
CREATE FUNCTION ed_rpc_lab.mutate_context(
 p_kind text,p_cart text,p_expected bigint,p_distance numeric DEFAULT NULL
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,ed_rpc_lab AS $func$
DECLARE next_v bigint; old_v bigint; c ed_rpc_lab.carts%ROWTYPE;
 w ed_rpc_lab.warehouses%ROWTYPE;
BEGIN
 IF current_setting('transaction_isolation') <> 'read committed' THEN
  RAISE EXCEPTION 'unsupported_isolation' USING ERRCODE='0A000';
 END IF;
 IF session_user<>'ed_lab_admin' THEN
  RAISE EXCEPTION 'forbidden_role' USING ERRCODE='42501';
 END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('cart','destination','warehouse','route') OR p_expected IS NULL
    OR p_expected<1 THEN
  RAISE EXCEPTION 'invalid_mutation' USING ERRCODE='22023';
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock_shared(917321);
 IF p_kind='warehouse' THEN
  PERFORM pg_catalog.pg_advisory_xact_lock(917322);
  SELECT * INTO w FROM ed_rpc_lab.warehouses WHERE singleton=true FOR UPDATE;
  IF NOT FOUND OR w.version<>p_expected THEN
   RAISE EXCEPTION 'stale_warehouse' USING ERRCODE='40001';
  END IF;
  UPDATE ed_rpc_lab.warehouses SET version=version+1 WHERE singleton=true
   RETURNING version INTO next_v;
 ELSE
  IF p_cart IS NULL OR p_cart='' THEN
   RAISE EXCEPTION 'missing_cart' USING ERRCODE='22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock_shared(917322);
  PERFORM pg_catalog.pg_advisory_xact_lock(917323,pg_catalog.hashtext(p_cart));
  SELECT * INTO c FROM ed_rpc_lab.carts WHERE cart_id=p_cart FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'missing_cart' USING ERRCODE='42501'; END IF;
  IF p_kind='cart' THEN
   old_v=c.revision;
   IF old_v<>p_expected THEN RAISE EXCEPTION 'stale_cart' USING ERRCODE='40001'; END IF;
   UPDATE ed_rpc_lab.carts SET revision=revision+1 WHERE cart_id=p_cart
    RETURNING revision INTO next_v;
  ELSIF p_kind='destination' THEN
   old_v=c.destination_version;
   IF old_v<>p_expected THEN RAISE EXCEPTION 'stale_destination' USING ERRCODE='40001'; END IF;
   UPDATE ed_rpc_lab.carts SET destination_version=destination_version+1 WHERE cart_id=p_cart
    RETURNING destination_version INTO next_v;
  ELSE
   IF p_distance IS NULL OR p_distance<0 OR p_distance>10000 THEN
    RAISE EXCEPTION 'invalid_distance' USING ERRCODE='22023';
   END IF;
   SELECT * INTO w FROM ed_rpc_lab.warehouses WHERE singleton=true;
   SELECT route_version INTO old_v FROM ed_rpc_lab.routes WHERE cart_id=p_cart FOR UPDATE;
   IF old_v IS NULL OR old_v<>p_expected THEN
    RAISE EXCEPTION 'stale_route' USING ERRCODE='40001';
   END IF;
   UPDATE ed_rpc_lab.routes SET route_version=route_version+1,
     cart_revision=c.revision,destination_version=c.destination_version,
     warehouse_version=w.version,distance_km=p_distance,
     expires_at=clock_timestamp()+interval '1 hour'
   WHERE cart_id=p_cart RETURNING route_version INTO next_v;
  END IF;
 END IF;
 INSERT INTO ed_rpc_lab.context_audit(actor_role,change_kind,cart_id,previous_version,next_version)
 VALUES(session_user::name,p_kind,CASE WHEN p_kind='warehouse' THEN NULL ELSE p_cart END,p_expected,next_v);
 RETURN next_v;
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
                 AND (c.manager_role=session_user::name OR session_user='ed_lab_admin')));
CREATE POLICY settings_rpc_read ON ed_rpc_lab.settings FOR SELECT TO ed_lab_rpc_owner
 USING(session_user IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin'));
CREATE POLICY settings_rpc_update ON ed_rpc_lab.settings FOR UPDATE TO ed_lab_rpc_owner
 USING(session_user='ed_lab_admin')
 WITH CHECK(session_user='ed_lab_admin');
CREATE POLICY quotes_rpc_insert ON ed_rpc_lab.quotes FOR INSERT TO ed_lab_rpc_owner
 WITH CHECK(actor_role=session_user::name
            AND session_user IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin'));
CREATE POLICY quotes_rpc_update ON ed_rpc_lab.quotes FOR UPDATE TO ed_lab_rpc_owner
 USING(actor_role=session_user::name)
 WITH CHECK(actor_role=session_user::name);
CREATE POLICY audit_rpc_insert ON ed_rpc_lab.audit FOR INSERT TO ed_lab_rpc_owner
 WITH CHECK(session_user='ed_lab_admin' AND actor_role='ed_lab_admin');
GRANT USAGE ON SCHEMA ed_rpc_lab TO ed_lab_rpc_owner;
GRANT SELECT ON ed_rpc_lab.carts,ed_rpc_lab.routes,ed_rpc_lab.settings,ed_rpc_lab.quotes
 TO ed_lab_rpc_owner;
GRANT INSERT ON ed_rpc_lab.quotes,ed_rpc_lab.audit TO ed_lab_rpc_owner;
GRANT UPDATE ON ed_rpc_lab.settings,ed_rpc_lab.quotes TO ed_lab_rpc_owner;
ALTER FUNCTION ed_rpc_lab.quote_preview(text,text,text,bigint) OWNER TO ed_lab_rpc_owner;
ALTER FUNCTION ed_rpc_lab.update_rate(bigint,numeric,text) OWNER TO ed_lab_rpc_owner;


ALTER TABLE ed_rpc_lab.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.warehouses FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.context_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_rpc_lab.context_audit FORCE ROW LEVEL SECURITY;
CREATE POLICY warehouses_read ON ed_rpc_lab.warehouses FOR SELECT TO ed_lab_rpc_owner
 USING(session_user IN ('ed_lab_gestor_a','ed_lab_gestor_b','ed_lab_admin'));
CREATE POLICY warehouses_write ON ed_rpc_lab.warehouses FOR UPDATE TO ed_lab_rpc_owner
 USING(session_user='ed_lab_admin') WITH CHECK(session_user='ed_lab_admin');
CREATE POLICY carts_admin_update ON ed_rpc_lab.carts FOR UPDATE TO ed_lab_rpc_owner
 USING(session_user='ed_lab_admin') WITH CHECK(session_user='ed_lab_admin');
CREATE POLICY routes_admin_update ON ed_rpc_lab.routes FOR UPDATE TO ed_lab_rpc_owner
 USING(session_user='ed_lab_admin') WITH CHECK(session_user='ed_lab_admin');
CREATE POLICY context_audit_write ON ed_rpc_lab.context_audit FOR INSERT TO ed_lab_rpc_owner
 WITH CHECK(session_user='ed_lab_admin' AND actor_role='ed_lab_admin');
CREATE POLICY context_audit_read ON ed_rpc_lab.context_audit FOR SELECT
 USING(session_user='ed_lab_admin');
GRANT SELECT ON ed_rpc_lab.warehouses TO ed_lab_rpc_owner;
GRANT SELECT ON ed_rpc_lab.context_audit TO ed_lab_admin;
GRANT UPDATE ON ed_rpc_lab.carts,ed_rpc_lab.routes,ed_rpc_lab.warehouses TO ed_lab_rpc_owner;
GRANT INSERT ON ed_rpc_lab.context_audit TO ed_lab_rpc_owner;
ALTER FUNCTION ed_rpc_lab.mutate_context(text,text,bigint,numeric) OWNER TO ed_lab_rpc_owner;
GRANT EXECUTE ON FUNCTION ed_rpc_lab.mutate_context(text,text,bigint,numeric) TO ed_lab_admin;

GRANT USAGE ON SCHEMA ed_rpc_lab TO ed_lab_gestor_a,ed_lab_gestor_b,ed_lab_admin,ed_lab_supervisor;
GRANT SELECT ON ed_rpc_lab.carts,ed_rpc_lab.quotes TO ed_lab_gestor_a,ed_lab_gestor_b,ed_lab_admin;
GRANT SELECT ON ed_rpc_lab.audit TO ed_lab_admin;
GRANT EXECUTE ON FUNCTION ed_rpc_lab.quote_preview(text,text,text,bigint) TO ed_lab_gestor_a,ed_lab_gestor_b,ed_lab_admin;
GRANT EXECUTE ON FUNCTION ed_rpc_lab.update_rate(bigint,numeric,text) TO ed_lab_admin;
COMMIT;
