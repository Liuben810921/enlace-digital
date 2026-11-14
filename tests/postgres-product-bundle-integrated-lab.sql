\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA ed_integrated_lab;
CREATE ROLE ed_integrated_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE ed_integrated_a LOGIN PASSWORD 'synthetic-a' NOBYPASSRLS;
CREATE ROLE ed_integrated_b LOGIN PASSWORD 'synthetic-b' NOBYPASSRLS;
GRANT USAGE ON SCHEMA ed_integrated_lab TO ed_integrated_owner,ed_integrated_a,ed_integrated_b;
CREATE TABLE ed_integrated_lab.identities(login_name name PRIMARY KEY,tenant text NOT NULL UNIQUE);
INSERT INTO ed_integrated_lab.identities VALUES('ed_integrated_a','a'),('ed_integrated_b','b');
CREATE TABLE ed_integrated_lab.versions(tenant text PRIMARY KEY,revision bigint NOT NULL DEFAULT 0);
CREATE TABLE ed_integrated_lab.suppliers(tenant text NOT NULL,id text NOT NULL,active boolean NOT NULL,PRIMARY KEY(tenant,id));
CREATE TABLE ed_integrated_lab.warehouses(tenant text NOT NULL,id text NOT NULL,supplier_id text,kind text NOT NULL CHECK(kind IN ('proveedor','propio')),active boolean NOT NULL,PRIMARY KEY(tenant,id),FOREIGN KEY(tenant,supplier_id) REFERENCES ed_integrated_lab.suppliers(tenant,id));
CREATE TABLE ed_integrated_lab.products(tenant text NOT NULL,id text NOT NULL,supplier_id text,kind text NOT NULL,primary_warehouse text NOT NULL,published boolean NOT NULL DEFAULT false CHECK(NOT published),status text NOT NULL DEFAULT 'draft' CHECK(status='draft'),PRIMARY KEY(tenant,id),FOREIGN KEY(tenant,supplier_id) REFERENCES ed_integrated_lab.suppliers(tenant,id),FOREIGN KEY(tenant,primary_warehouse) REFERENCES ed_integrated_lab.warehouses(tenant,id));
CREATE TABLE ed_integrated_lab.product_warehouses(tenant text NOT NULL,product_id text NOT NULL,warehouse_id text NOT NULL,PRIMARY KEY(tenant,product_id,warehouse_id),FOREIGN KEY(tenant,product_id) REFERENCES ed_integrated_lab.products(tenant,id),FOREIGN KEY(tenant,warehouse_id) REFERENCES ed_integrated_lab.warehouses(tenant,id));
CREATE TABLE ed_integrated_lab.operations(tenant text NOT NULL,op text NOT NULL,payload jsonb NOT NULL,result jsonb NOT NULL,PRIMARY KEY(tenant,op));
INSERT INTO ed_integrated_lab.versions VALUES('a',0),('b',0);
INSERT INTO ed_integrated_lab.suppliers VALUES('a','s',true),('b','s',true),('a','off',false);
INSERT INTO ed_integrated_lab.warehouses VALUES('a','w1','s','proveedor',true),('a','w2','s','proveedor',true),('a','inactive','s','proveedor',false),('a','foreign-supplier','off','proveedor',true),('b','w1','s','proveedor',true),('b','w2','s','proveedor',true);
ALTER TABLE ed_integrated_lab.identities OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.versions OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.suppliers OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.warehouses OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.products OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.product_warehouses OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.operations OWNER TO ed_integrated_owner;
ALTER TABLE ed_integrated_lab.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_integrated_lab.identities FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_identity ON ed_integrated_lab.identities TO ed_integrated_owner USING(true);
GRANT SELECT ON ed_integrated_lab.identities TO ed_integrated_owner;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['versions','suppliers','warehouses','products','product_warehouses','operations'] LOOP
  EXECUTE format('ALTER TABLE ed_integrated_lab.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE ed_integrated_lab.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY owner_tenant ON ed_integrated_lab.%I TO ed_integrated_owner USING (tenant=(SELECT tenant FROM ed_integrated_lab.identities WHERE login_name=session_user)) WITH CHECK (tenant=(SELECT tenant FROM ed_integrated_lab.identities WHERE login_name=session_user))',t);
 END LOOP;
END $$;
GRANT SELECT,UPDATE ON ed_integrated_lab.versions TO ed_integrated_owner;
GRANT SELECT ON ed_integrated_lab.suppliers,ed_integrated_lab.warehouses TO ed_integrated_owner;
GRANT SELECT,INSERT ON ed_integrated_lab.products,ed_integrated_lab.product_warehouses,ed_integrated_lab.operations TO ed_integrated_owner;
CREATE FUNCTION ed_integrated_lab.commit_bundle(p_op text,p_product text,p_supplier text,p_warehouses text[],p_kind text,p_expected bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_integrated_lab AS $$
DECLARE v_tenant text; v_rev bigint; v_prev ed_integrated_lab.operations%ROWTYPE; v_sorted text[]; v_payload jsonb; v_result jsonb; v_lock text;
BEGIN
 SELECT tenant INTO v_tenant FROM ed_integrated_lab.identities WHERE login_name=session_user;
 IF v_tenant IS NULL OR p_op IS NULL OR length(trim(p_op))=0 OR p_product IS NULL OR length(trim(p_product))=0 OR p_kind IS NULL OR p_kind NOT IN ('proveedor','propio') OR p_warehouses IS NULL OR cardinality(p_warehouses)=0 OR EXISTS(SELECT 1 FROM unnest(p_warehouses) x WHERE x IS NULL OR length(trim(x))=0) OR cardinality(p_warehouses)<>(SELECT count(DISTINCT x) FROM unnest(p_warehouses) x) THEN
  RETURN jsonb_build_object('status','invalid');
 END IF;
 SELECT array_agg(x ORDER BY x) INTO v_sorted FROM unnest(p_warehouses) x;
 v_payload=jsonb_build_object('product',p_product,'supplier',p_supplier,'warehouses',v_sorted,'kind',p_kind);
 SELECT revision INTO v_rev FROM ed_integrated_lab.versions WHERE tenant=v_tenant FOR UPDATE;
 SELECT * INTO v_prev FROM ed_integrated_lab.operations WHERE tenant=v_tenant AND op=p_op;
 IF FOUND THEN
  IF v_prev.payload=v_payload THEN RETURN v_prev.result || jsonb_build_object('replayed',true); END IF;
  RETURN jsonb_build_object('status','idempotency_conflict');
 END IF;
 IF p_expected IS DISTINCT FROM v_rev THEN RETURN jsonb_build_object('status','stale_revision'); END IF;
 -- Lock the supplier and every chosen warehouse before checking active state.
 -- FOR SHARE conflicts with UPDATE and protects the state through COMMIT.
 IF p_supplier IS NOT NULL THEN
  PERFORM 1 FROM ed_integrated_lab.suppliers
   WHERE tenant=v_tenant AND id=p_supplier FOR SHARE;
 END IF;
 FOREACH v_lock IN ARRAY v_sorted LOOP
  PERFORM 1 FROM ed_integrated_lab.warehouses
   WHERE tenant=v_tenant AND id=v_lock FOR SHARE;
 END LOOP;
 IF EXISTS(
  SELECT 1 FROM unnest(v_sorted) chosen(id)
  WHERE NOT EXISTS (
   SELECT 1 FROM ed_integrated_lab.warehouses w
   LEFT JOIN ed_integrated_lab.suppliers s ON s.tenant=w.tenant AND s.id=w.supplier_id
   WHERE w.tenant=v_tenant AND w.id=chosen.id AND w.active AND w.kind=p_kind
   AND ((p_kind='proveedor' AND s.tenant=v_tenant AND s.id=p_supplier AND s.active)
        OR (p_kind='propio' AND p_supplier IS NULL AND w.supplier_id IS NULL))
  )
 ) THEN RETURN jsonb_build_object('status','invalid_origin'); END IF;
 IF EXISTS(SELECT 1 FROM ed_integrated_lab.products WHERE tenant=v_tenant AND id=p_product) THEN RETURN jsonb_build_object('status','product_conflict'); END IF;
 INSERT INTO ed_integrated_lab.products(tenant,id,supplier_id,kind,primary_warehouse) VALUES(v_tenant,p_product,p_supplier,p_kind,v_sorted[1]);
 INSERT INTO ed_integrated_lab.product_warehouses SELECT v_tenant,p_product,unnest(v_sorted);
 UPDATE ed_integrated_lab.versions SET revision=revision+1 WHERE tenant=v_tenant;
 v_result=jsonb_build_object('status','draft','tenant',v_tenant,'revision',v_rev+1,'published',false);
 INSERT INTO ed_integrated_lab.operations VALUES(v_tenant,p_op,v_payload,v_result);
 RETURN v_result;
END $$;
ALTER FUNCTION ed_integrated_lab.commit_bundle(text,text,text,text[],text,bigint) OWNER TO ed_integrated_owner;
REVOKE ALL ON FUNCTION ed_integrated_lab.commit_bundle(text,text,text,text[],text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ed_integrated_lab.commit_bundle(text,text,text,text[],text,bigint) TO ed_integrated_a,ed_integrated_b;
COMMIT;
