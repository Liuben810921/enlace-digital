-- Synthetic disposable PostgreSQL contract. Never run against Supabase.
BEGIN;
CREATE SCHEMA quote_lab;
CREATE TABLE quote_lab.settings (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), version bigint NOT NULL CHECK(version>0), threshold_usd numeric(12,2) NOT NULL CHECK(threshold_usd>0));
INSERT INTO quote_lab.settings(singleton,version,threshold_usd) VALUES(true,1,200);
CREATE TABLE quote_lab.operations(
 actor text NOT NULL, operation_key text NOT NULL, payload_hash text NOT NULL,
 settings_version bigint NOT NULL, amount_cup bigint NOT NULL,
 status text NOT NULL DEFAULT 'committed' CHECK(status='committed'),
 PRIMARY KEY(actor,operation_key)
);
CREATE TABLE quote_lab.audit (
 version bigint PRIMARY KEY, actor text NOT NULL, threshold_usd numeric(12,2) NOT NULL
);
CREATE OR REPLACE FUNCTION quote_lab.quote(p_actor text,p_key text,p_hash text,p_amount bigint,p_expected_version bigint)
RETURNS TABLE(outcome text,amount bigint,version bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,quote_lab AS $$
DECLARE s_version bigint; existing quote_lab.operations%ROWTYPE;
BEGIN
 IF p_actor IS NULL OR p_key IS NULL OR p_hash IS NULL OR length(p_actor) NOT BETWEEN 1 AND 80
  OR length(p_key) NOT BETWEEN 1 AND 80 OR length(p_hash) NOT BETWEEN 1 AND 128
  OR p_amount IS NULL OR p_amount<0 OR p_expected_version IS NULL THEN
  RAISE EXCEPTION 'invalid_quote_request' USING ERRCODE='22023';
 END IF;
 -- Serialize same key and settings changes via a row lock. No external effects.
 SELECT s.version INTO s_version FROM quote_lab.settings AS s WHERE s.singleton=true FOR SHARE;
 SELECT * INTO existing FROM quote_lab.operations WHERE actor=p_actor AND operation_key=p_key FOR UPDATE;
 IF FOUND THEN
  IF existing.payload_hash<>p_hash THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23505'; END IF;
  IF existing.settings_version<>s_version OR s_version<>p_expected_version THEN
   RAISE EXCEPTION 'stale_quote' USING ERRCODE='40001';
  END IF;
  RETURN QUERY SELECT 'replayed'::text,existing.amount_cup,existing.settings_version;
  RETURN;
 END IF;
 IF s_version<>p_expected_version THEN RAISE EXCEPTION 'stale_settings' USING ERRCODE='40001'; END IF;
 INSERT INTO quote_lab.operations(actor,operation_key,payload_hash,settings_version,amount_cup)
 VALUES(p_actor,p_key,p_hash,s_version,p_amount)
 ON CONFLICT (actor,operation_key) DO NOTHING;
 SELECT * INTO existing FROM quote_lab.operations WHERE actor=p_actor AND operation_key=p_key FOR UPDATE;
 IF existing.payload_hash<>p_hash THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23505'; END IF;
 RETURN QUERY SELECT CASE WHEN existing.amount_cup=p_amount THEN 'committed' ELSE 'replayed' END::text,
 existing.amount_cup,existing.settings_version;
END $$;
CREATE OR REPLACE FUNCTION quote_lab.change_threshold(p_actor text,p_expected_version bigint,p_threshold numeric)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,quote_lab AS $$
DECLARE v bigint;
BEGIN
 IF p_actor IS NULL OR length(p_actor) NOT BETWEEN 1 AND 80 OR p_threshold IS NULL OR p_threshold<=0 THEN
  RAISE EXCEPTION 'invalid_change' USING ERRCODE='22023';
 END IF;
 UPDATE quote_lab.settings SET version=version+1,threshold_usd=p_threshold
 WHERE singleton=true AND version=p_expected_version RETURNING version INTO v;
 IF NOT FOUND THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='40001'; END IF;
 INSERT INTO quote_lab.audit(version,actor,threshold_usd) VALUES(v,p_actor,p_threshold);
 RETURN v;
END $$;

-- Versions for synthetic address and warehouse assignment; no actual personal addresses.
CREATE TABLE quote_lab.routing_context(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 address_version bigint NOT NULL DEFAULT 1,
 warehouse_version bigint NOT NULL DEFAULT 1
);
INSERT INTO quote_lab.routing_context(singleton,address_version,warehouse_version) VALUES(true,1,1);
CREATE OR REPLACE FUNCTION quote_lab.quote_bound(
 p_actor text,p_key text,p_hash text,p_amount bigint,p_settings bigint,p_address bigint,p_warehouse bigint
) RETURNS TABLE(outcome text,amount bigint,version bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,quote_lab AS $body$
DECLARE a bigint; w bigint;
BEGIN
 -- Shared lock serializes context mutations with quote commit.
 SELECT r.address_version,r.warehouse_version INTO a,w
 FROM quote_lab.routing_context AS r WHERE r.singleton=true FOR SHARE;
 IF a<>p_address OR w<>p_warehouse THEN
  RAISE EXCEPTION 'stale_route_context' USING ERRCODE='40001';
 END IF;
 RETURN QUERY SELECT q.outcome,q.amount,q.version
 FROM quote_lab.quote(p_actor,p_key,p_hash,p_amount,p_settings) AS q;
END $body$;
CREATE TABLE quote_lab.deadlock_a(id int PRIMARY KEY, value int NOT NULL);
CREATE TABLE quote_lab.deadlock_b(id int PRIMARY KEY, value int NOT NULL);
INSERT INTO quote_lab.deadlock_a VALUES(1,0);
INSERT INTO quote_lab.deadlock_b VALUES(1,0);
COMMIT;
