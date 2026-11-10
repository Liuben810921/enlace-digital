-- F6-B21: disposable PostgreSQL 17 only. Synthetic database-login identity, not Supabase auth.
\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA f6b21_synthetic;
CREATE ROLE f6b21_owner NOLOGIN NOBYPASSRLS;
CREATE ROLE f6b21_a LOGIN PASSWORD 'synthetic_a_only' NOBYPASSRLS;
CREATE ROLE f6b21_b LOGIN PASSWORD 'synthetic_b_only' NOBYPASSRLS;
CREATE ROLE f6b21_stranger LOGIN PASSWORD 'synthetic_stranger_only' NOBYPASSRLS;
REVOKE ALL ON SCHEMA f6b21_synthetic FROM PUBLIC;
GRANT USAGE ON SCHEMA f6b21_synthetic TO f6b21_owner,f6b21_a,f6b21_b,f6b21_stranger;
CREATE TABLE f6b21_synthetic.operations(
 identity_name name NOT NULL,
 operation_key text NOT NULL CHECK(length(operation_key) BETWEEN 8 AND 100),
 digest bytea NOT NULL CHECK(octet_length(digest)=32),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(identity_name,operation_key)
);
ALTER TABLE f6b21_synthetic.operations OWNER TO f6b21_owner;
ALTER TABLE f6b21_synthetic.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE f6b21_synthetic.operations FORCE ROW LEVEL SECURITY;
CREATE POLICY f6b21_owner_policy ON f6b21_synthetic.operations TO f6b21_owner USING(true) WITH CHECK(true);
-- Owner is subject to RLS via FORCE; no table grants to callers.
CREATE FUNCTION f6b21_synthetic.reserve(k text, payload jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp AS $$
DECLARE who name; canonical text; d bytea; inserted name; prior bytea;
BEGIN
 who := session_user; -- immutable per authenticated DB connection; SET ROLE cannot spoof.
 IF who NOT IN ('f6b21_a','f6b21_b') THEN
  RAISE EXCEPTION 'unauthorized synthetic identity' USING ERRCODE='42501';
 END IF;
 IF k IS NULL OR length(k) NOT BETWEEN 8 AND 100 OR payload IS NULL
    OR jsonb_typeof(payload)<>'object'
    OR NOT (payload ? 'action') OR NOT (payload ? 'amount')
    OR (SELECT count(*) FROM jsonb_object_keys(payload))<>2
    OR jsonb_typeof(payload->'action')<>'string'
    OR jsonb_typeof(payload->'amount')<>'number'
    OR length(payload->>'action') NOT BETWEEN 1 AND 40 THEN
   RAISE EXCEPTION 'invalid synthetic payload' USING ERRCODE='22023';
 END IF;
 -- PostgreSQL jsonb canonicalizes object key order and whitespace; exact JSON numeric
 -- semantics are PostgreSQL-specific, not a cross-language canonicalization standard.
 canonical := payload::text;
 d := public.digest(convert_to('F6B21-v1|'||canonical,'UTF8'),'sha256');
 INSERT INTO f6b21_synthetic.operations(identity_name,operation_key,digest)
 VALUES(who,k,d) ON CONFLICT DO NOTHING RETURNING identity_name INTO inserted;
 IF inserted IS NOT NULL THEN RETURN 'NEW_SYNTHETIC'; END IF;
 SELECT digest INTO prior FROM f6b21_synthetic.operations
 WHERE identity_name=who AND operation_key=k;
 IF NOT FOUND THEN RAISE EXCEPTION 'retry transient' USING ERRCODE='40001'; END IF;
 IF prior=d THEN RETURN 'REPLAY_SYNTHETIC'; END IF;
 RETURN 'CONFLICT_SYNTHETIC';
END $$;
ALTER FUNCTION f6b21_synthetic.reserve(text,jsonb) OWNER TO f6b21_owner;
REVOKE ALL ON FUNCTION f6b21_synthetic.reserve(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION f6b21_synthetic.reserve(text,jsonb) TO f6b21_a,f6b21_b;
DO $$
BEGIN
 IF has_table_privilege('f6b21_a','f6b21_synthetic.operations','SELECT')
 OR has_table_privilege('f6b21_b','f6b21_synthetic.operations','INSERT')
 OR has_function_privilege('f6b21_stranger','f6b21_synthetic.reserve(text,jsonb)','EXECUTE')
 OR NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid='f6b21_synthetic.operations'::regclass)
 OR (SELECT rolbypassrls FROM pg_roles WHERE rolname='f6b21_owner')
 THEN RAISE EXCEPTION 'F6-B21 ACL/RLS failure'; END IF;
END $$;
