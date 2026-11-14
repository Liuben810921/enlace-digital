\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA ed_bundle_lab;
CREATE ROLE ed_bundle_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE ed_bundle_client NOLOGIN NOBYPASSRLS;
GRANT USAGE ON SCHEMA ed_bundle_lab TO ed_bundle_owner,ed_bundle_client;
CREATE TABLE ed_bundle_lab.context(id int PRIMARY KEY CHECK(id=1),revision bigint NOT NULL CHECK(revision>=0));
CREATE TABLE ed_bundle_lab.suppliers(id text PRIMARY KEY,active boolean NOT NULL);
CREATE TABLE ed_bundle_lab.warehouses(id text PRIMARY KEY,supplier_id text REFERENCES ed_bundle_lab.suppliers(id),kind text NOT NULL CHECK(kind IN ('proveedor','propio')),active boolean NOT NULL);
CREATE TABLE ed_bundle_lab.products(id text PRIMARY KEY,supplier_id text REFERENCES ed_bundle_lab.suppliers(id),kind text NOT NULL,warehouse_id text NOT NULL REFERENCES ed_bundle_lab.warehouses(id),published boolean NOT NULL DEFAULT false CHECK(published=false),status text NOT NULL DEFAULT 'draft' CHECK(status='draft'));
CREATE TABLE ed_bundle_lab.operations(op text PRIMARY KEY,payload jsonb NOT NULL,result jsonb NOT NULL);
INSERT INTO ed_bundle_lab.context VALUES(1,0);
INSERT INTO ed_bundle_lab.suppliers VALUES('s1',true),('disabled',false);
INSERT INTO ed_bundle_lab.warehouses VALUES('w1','s1','proveedor',true),('w2','s1','proveedor',true),('off','s1','proveedor',false),('own',null,'propio',true);
ALTER TABLE ed_bundle_lab.context OWNER TO ed_bundle_owner;
ALTER TABLE ed_bundle_lab.suppliers OWNER TO ed_bundle_owner;
ALTER TABLE ed_bundle_lab.warehouses OWNER TO ed_bundle_owner;
ALTER TABLE ed_bundle_lab.products OWNER TO ed_bundle_owner;
ALTER TABLE ed_bundle_lab.operations OWNER TO ed_bundle_owner;
ALTER TABLE ed_bundle_lab.context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.context FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.suppliers FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.warehouses FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.products FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_bundle_lab.operations FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_context ON ed_bundle_lab.context TO ed_bundle_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_suppliers ON ed_bundle_lab.suppliers TO ed_bundle_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_warehouses ON ed_bundle_lab.warehouses TO ed_bundle_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_products ON ed_bundle_lab.products TO ed_bundle_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_operations ON ed_bundle_lab.operations TO ed_bundle_owner USING(true) WITH CHECK(true);
GRANT SELECT,UPDATE ON ed_bundle_lab.context TO ed_bundle_owner;
GRANT SELECT ON ed_bundle_lab.suppliers,ed_bundle_lab.warehouses TO ed_bundle_owner;
GRANT SELECT,INSERT ON ed_bundle_lab.products,ed_bundle_lab.operations TO ed_bundle_owner;
CREATE FUNCTION ed_bundle_lab.commit_bundle(p_op text,p_product text,p_supplier text,p_warehouse text,p_kind text,p_expected bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_bundle_lab AS $$
DECLARE v_revision bigint; v_payload jsonb; v_previous ed_bundle_lab.operations%ROWTYPE; v_result jsonb;
BEGIN
 IF p_op IS NULL OR length(trim(p_op))=0 OR p_product IS NULL OR length(trim(p_product))=0 OR p_warehouse IS NULL OR length(trim(p_warehouse))=0 OR p_kind NOT IN ('proveedor','propio') OR p_kind IS NULL THEN
  RETURN jsonb_build_object('status','invalid');
 END IF;
 v_payload=jsonb_build_object('product',p_product,'supplier',p_supplier,'warehouse',p_warehouse,'kind',p_kind);
 SELECT revision INTO v_revision FROM ed_bundle_lab.context WHERE id=1 FOR UPDATE;
 SELECT * INTO v_previous FROM ed_bundle_lab.operations WHERE op=p_op;
 IF FOUND THEN
  IF v_previous.payload=v_payload THEN RETURN v_previous.result || jsonb_build_object('replayed',true); END IF;
  RETURN jsonb_build_object('status','idempotency_conflict');
 END IF;
 IF p_expected IS DISTINCT FROM v_revision THEN RETURN jsonb_build_object('status','stale_revision'); END IF;
 IF NOT EXISTS(SELECT 1 FROM ed_bundle_lab.warehouses w LEFT JOIN ed_bundle_lab.suppliers s ON s.id=w.supplier_id WHERE w.id=p_warehouse AND w.active AND w.kind=p_kind AND ((p_kind='propio' AND p_supplier IS NULL AND w.supplier_id IS NULL) OR (p_kind='proveedor' AND s.id=p_supplier AND s.active))) THEN
  RETURN jsonb_build_object('status','invalid_origin');
 END IF;
 IF EXISTS(SELECT 1 FROM ed_bundle_lab.products WHERE id=p_product) THEN RETURN jsonb_build_object('status','product_conflict'); END IF;
 INSERT INTO ed_bundle_lab.products(id,supplier_id,kind,warehouse_id) VALUES(p_product,p_supplier,p_kind,p_warehouse);
 UPDATE ed_bundle_lab.context SET revision=revision+1 WHERE id=1;
 v_result=jsonb_build_object('status','draft','product',p_product,'revision',v_revision+1,'published',false);
 INSERT INTO ed_bundle_lab.operations VALUES(p_op,v_payload,v_result);
 RETURN v_result;
END $$;
ALTER FUNCTION ed_bundle_lab.commit_bundle(text,text,text,text,text,bigint) OWNER TO ed_bundle_owner;
REVOKE ALL ON FUNCTION ed_bundle_lab.commit_bundle(text,text,text,text,text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ed_bundle_lab.commit_bundle(text,text,text,text,text,bigint) TO ed_bundle_client;
COMMIT;
