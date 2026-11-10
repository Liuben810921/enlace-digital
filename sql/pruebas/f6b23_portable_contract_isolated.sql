-- F6-B23: synthetic portable v1 byte contract; disposable PostgreSQL 17 ONLY.
\set ON_ERROR_STOP on
CREATE SCHEMA f6b23_synthetic;
CREATE ROLE f6b23_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE f6b23_a LOGIN PASSWORD 'synthetic_b23_a' NOBYPASSRLS;
CREATE ROLE f6b23_b LOGIN PASSWORD 'synthetic_b23_b' NOBYPASSRLS;
CREATE ROLE f6b23_stranger LOGIN PASSWORD 'synthetic_b23_stranger' NOBYPASSRLS;
REVOKE ALL ON SCHEMA f6b23_synthetic FROM PUBLIC;
GRANT USAGE ON SCHEMA f6b23_synthetic TO f6b23_owner,f6b23_a,f6b23_b,f6b23_stranger;
CREATE TABLE f6b23_synthetic.operations (
 identity_name name NOT NULL,
 operation_key text COLLATE "C" NOT NULL CHECK (octet_length(operation_key) BETWEEN 8 AND 100),
 digest bytea NOT NULL CHECK (octet_length(digest)=32),
 PRIMARY KEY(identity_name,operation_key)
);
ALTER TABLE f6b23_synthetic.operations OWNER TO f6b23_owner;
ALTER TABLE f6b23_synthetic.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE f6b23_synthetic.operations FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON f6b23_synthetic.operations TO f6b23_owner USING (true) WITH CHECK (true);
-- Versioned byte grammar: ASCII-only action and currency; integer minor units.
-- UTF-8 bytes: "ED-OP-v1\n" + action + "\n" + currency + "\n" + amount_minor decimal ASCII.
-- No Unicode free text in this protocol: reject rather than silently normalize.
CREATE FUNCTION f6b23_synthetic.reserve(k text,p jsonb) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE who name; act text; cur text; amt text; canonical text; h bytea; got name; prior bytea;
BEGIN
 who:=session_user;
 IF who NOT IN ('f6b23_a','f6b23_b') THEN
   RAISE EXCEPTION 'unauthorized identity' USING ERRCODE='42501';
 END IF;
 IF k IS NULL OR k !~ '^[A-Za-z0-9_-]{8,100}$'
 OR p IS NULL OR jsonb_typeof(p)<>'object'
 OR (SELECT count(*) FROM jsonb_object_keys(p))<>4
 OR NOT (p ?& ARRAY['version','action','currency','amount_minor'])
 OR jsonb_typeof(p->'version')<>'string'
 OR p->>'version'<>'ED-OP-v1'
 OR jsonb_typeof(p->'action')<>'string'
 OR jsonb_typeof(p->'currency')<>'string'
 OR jsonb_typeof(p->'amount_minor')<>'number'
 THEN RAISE EXCEPTION 'invalid contract' USING ERRCODE='22023'; END IF;
 act:=p->>'action'; cur:=p->>'currency'; amt:=p->>'amount_minor';
 IF act !~ '^[a-z][a-z0-9_]{0,39}$'
 OR cur !~ '^[A-Z]{3}$'
 OR amt !~ '^(0|[1-9][0-9]{0,14})$'
 THEN RAISE EXCEPTION 'invalid contract' USING ERRCODE='22023'; END IF;
 canonical:='ED-OP-v1'||chr(10)||act||chr(10)||cur||chr(10)||amt;
 h:=public.digest(convert_to(canonical,'UTF8'),'sha256');
 INSERT INTO f6b23_synthetic.operations(identity_name,operation_key,digest)
 VALUES(who,k,h) ON CONFLICT DO NOTHING RETURNING identity_name INTO got;
 IF got IS NOT NULL THEN RETURN 'NEW'; END IF;
 SELECT digest INTO prior FROM f6b23_synthetic.operations
 WHERE identity_name=who AND operation_key=k;
 IF NOT FOUND THEN RAISE EXCEPTION 'transient retry' USING ERRCODE='40001'; END IF;
 IF prior=h THEN RETURN 'REPLAY'; END IF;
 RETURN 'CONFLICT';
END $$;
ALTER FUNCTION f6b23_synthetic.reserve(text,jsonb) OWNER TO f6b23_owner;
REVOKE ALL ON FUNCTION f6b23_synthetic.reserve(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION f6b23_synthetic.reserve(text,jsonb) TO f6b23_a,f6b23_b;
DO $$ BEGIN
 IF has_table_privilege('f6b23_a','f6b23_synthetic.operations','SELECT')
 OR has_table_privilege('f6b23_b','f6b23_synthetic.operations','INSERT')
 OR has_function_privilege('f6b23_stranger','f6b23_synthetic.reserve(text,jsonb)','EXECUTE')
 OR NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid='f6b23_synthetic.operations'::regclass)
 THEN RAISE EXCEPTION 'F6-B23 ACL/RLS failure'; END IF;
END $$;
