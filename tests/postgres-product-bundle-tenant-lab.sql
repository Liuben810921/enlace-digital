\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA ed_tenant_lab;
CREATE ROLE ed_tenant_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE ed_tenant_a LOGIN PASSWORD 'synthetic-a' NOBYPASSRLS;
CREATE ROLE ed_tenant_b LOGIN PASSWORD 'synthetic-b' NOBYPASSRLS;
GRANT USAGE ON SCHEMA ed_tenant_lab TO ed_tenant_owner,ed_tenant_a,ed_tenant_b;
CREATE TABLE ed_tenant_lab.tenants(login_name name PRIMARY KEY,tenant text NOT NULL UNIQUE);
INSERT INTO ed_tenant_lab.tenants VALUES('ed_tenant_a','a'),('ed_tenant_b','b');
CREATE TABLE ed_tenant_lab.records(tenant text NOT NULL,product text NOT NULL,warehouses text[] NOT NULL,revision bigint NOT NULL,published boolean NOT NULL DEFAULT false CHECK(NOT published),PRIMARY KEY(tenant,product));
CREATE TABLE ed_tenant_lab.ops(tenant text NOT NULL,operation text NOT NULL,payload jsonb NOT NULL,result jsonb NOT NULL,PRIMARY KEY(tenant,operation));
CREATE TABLE ed_tenant_lab.versions(tenant text PRIMARY KEY,revision bigint NOT NULL);
INSERT INTO ed_tenant_lab.versions VALUES('a',0),('b',0);
ALTER TABLE ed_tenant_lab.tenants OWNER TO ed_tenant_owner;
ALTER TABLE ed_tenant_lab.records OWNER TO ed_tenant_owner;
ALTER TABLE ed_tenant_lab.ops OWNER TO ed_tenant_owner;
ALTER TABLE ed_tenant_lab.versions OWNER TO ed_tenant_owner;
ALTER TABLE ed_tenant_lab.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.records FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.ops FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_tenant_lab.versions FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_tenants ON ed_tenant_lab.tenants TO ed_tenant_owner USING(true);
CREATE POLICY owner_records ON ed_tenant_lab.records TO ed_tenant_owner USING(tenant=(SELECT t.tenant FROM ed_tenant_lab.tenants t WHERE t.login_name=session_user)) WITH CHECK(tenant=(SELECT t.tenant FROM ed_tenant_lab.tenants t WHERE t.login_name=session_user));
CREATE POLICY owner_ops ON ed_tenant_lab.ops TO ed_tenant_owner USING(tenant=(SELECT t.tenant FROM ed_tenant_lab.tenants t WHERE t.login_name=session_user)) WITH CHECK(tenant=(SELECT t.tenant FROM ed_tenant_lab.tenants t WHERE t.login_name=session_user));
CREATE POLICY owner_versions ON ed_tenant_lab.versions TO ed_tenant_owner USING(tenant=(SELECT t.tenant FROM ed_tenant_lab.tenants t WHERE t.login_name=session_user)) WITH CHECK(tenant=(SELECT t.tenant FROM ed_tenant_lab.tenants t WHERE t.login_name=session_user));
GRANT SELECT ON ed_tenant_lab.tenants TO ed_tenant_owner;
GRANT SELECT,INSERT ON ed_tenant_lab.records,ed_tenant_lab.ops TO ed_tenant_owner;
GRANT SELECT,UPDATE ON ed_tenant_lab.versions TO ed_tenant_owner;
CREATE FUNCTION ed_tenant_lab.commit_multi(p_op text,p_product text,p_warehouses text[],p_expected bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ed_tenant_lab AS $$
DECLARE v_tenant text; v_rev bigint; v_prev ed_tenant_lab.ops%ROWTYPE; v_payload jsonb; v_result jsonb; v_sorted text[];
BEGIN
 SELECT tenant INTO v_tenant FROM ed_tenant_lab.tenants WHERE login_name=session_user;
 IF v_tenant IS NULL OR p_op IS NULL OR length(trim(p_op))=0 OR p_product IS NULL OR length(trim(p_product))=0 OR p_warehouses IS NULL OR cardinality(p_warehouses)=0 OR EXISTS(SELECT 1 FROM unnest(p_warehouses) x WHERE x IS NULL OR length(trim(x))=0) OR cardinality(p_warehouses)<>(SELECT count(DISTINCT x) FROM unnest(p_warehouses) x) THEN
  RETURN jsonb_build_object('status','invalid');
 END IF;
 SELECT array_agg(x ORDER BY x) INTO v_sorted FROM unnest(p_warehouses) x;
 v_payload=jsonb_build_object('product',p_product,'warehouses',v_sorted);
 SELECT revision INTO v_rev FROM ed_tenant_lab.versions WHERE tenant=v_tenant FOR UPDATE;
 SELECT * INTO v_prev FROM ed_tenant_lab.ops WHERE tenant=v_tenant AND operation=p_op;
 IF FOUND THEN
  IF v_prev.payload=v_payload THEN RETURN v_prev.result || jsonb_build_object('replayed',true); END IF;
  RETURN jsonb_build_object('status','idempotency_conflict');
 END IF;
 IF p_expected IS DISTINCT FROM v_rev THEN RETURN jsonb_build_object('status','stale_revision'); END IF;
 IF EXISTS(SELECT 1 FROM ed_tenant_lab.records WHERE tenant=v_tenant AND product=p_product) THEN RETURN jsonb_build_object('status','product_conflict'); END IF;
 INSERT INTO ed_tenant_lab.records VALUES(v_tenant,p_product,v_sorted,v_rev+1,false);
 UPDATE ed_tenant_lab.versions SET revision=revision+1 WHERE tenant=v_tenant;
 v_result=jsonb_build_object('status','draft','revision',v_rev+1,'tenant',v_tenant);
 INSERT INTO ed_tenant_lab.ops VALUES(v_tenant,p_op,v_payload,v_result);
 RETURN v_result;
END $$;
ALTER FUNCTION ed_tenant_lab.commit_multi(text,text,text[],bigint) OWNER TO ed_tenant_owner;
REVOKE ALL ON FUNCTION ed_tenant_lab.commit_multi(text,text,text[],bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ed_tenant_lab.commit_multi(text,text,text[],bigint) TO ed_tenant_a,ed_tenant_b;
COMMIT;
