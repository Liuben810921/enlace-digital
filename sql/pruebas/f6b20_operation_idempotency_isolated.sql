-- F6-B20: synthetic operation idempotency; disposable PostgreSQL only.
\set ON_ERROR_STOP on
CREATE SCHEMA f6b20_synthetic;
CREATE ROLE f6b20_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b20_caller NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b20_stranger NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE TABLE f6b20_synthetic.operations(
  client_id integer NOT NULL CHECK (client_id>0),
  operation_key text NOT NULL CHECK (char_length(operation_key) BETWEEN 8 AND 100),
  payload_digest text NOT NULL CHECK (char_length(payload_digest)=64),
  address_key bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(client_id,operation_key)
);
ALTER TABLE f6b20_synthetic.operations ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA f6b20_synthetic TO f6b20_owner,f6b20_caller,f6b20_stranger;
GRANT SELECT,INSERT ON f6b20_synthetic.operations TO f6b20_owner;
CREATE POLICY f6b20_owner_access ON f6b20_synthetic.operations TO f6b20_owner USING (true) WITH CHECK (true);
GRANT CREATE ON SCHEMA f6b20_synthetic TO f6b20_owner;
CREATE FUNCTION f6b20_synthetic.reserve_operation(c integer,k text,p text,a text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $fn$
DECLARE d text; ak bytea; inserted integer; previous record;
BEGIN
 IF c IS NULL OR c<=0 OR k IS NULL OR char_length(k) NOT BETWEEN 8 AND 100
    OR p IS NULL OR p !~ '^[0-9a-f]{64}$' OR a IS NULL THEN
   RAISE EXCEPTION 'invalid synthetic operation' USING ERRCODE='22023';
 END IF;
 -- In a real API, the digest must be computed server-side from canonical payload bytes.
 -- Here the synthetic caller supplies a 64-char test digest. This is NOT authentication.
 d:=p; ak:=convert_to(f6b18_synthetic.norm_v1(a),'UTF8');
 IF octet_length(ak)=0 THEN RAISE EXCEPTION 'invalid synthetic address' USING ERRCODE='22023'; END IF;
 INSERT INTO f6b20_synthetic.operations(client_id,operation_key,payload_digest,address_key)
 VALUES(c,k,d,ak) ON CONFLICT (client_id,operation_key) DO NOTHING
 RETURNING client_id INTO inserted;
 IF inserted IS NOT NULL THEN RETURN 'NEW_SYNTHETIC'; END IF;
 SELECT payload_digest,address_key INTO previous
 FROM f6b20_synthetic.operations WHERE client_id=c AND operation_key=k;
 IF NOT FOUND THEN RAISE EXCEPTION 'retry transient' USING ERRCODE='40001'; END IF;
 IF previous.payload_digest=d AND previous.address_key=ak THEN RETURN 'REPLAY_SYNTHETIC'; END IF;
 RETURN 'CONFLICT_SYNTHETIC';
END $fn$;
REVOKE ALL ON FUNCTION f6b20_synthetic.reserve_operation(integer,text,text,text) FROM PUBLIC;
ALTER FUNCTION f6b20_synthetic.reserve_operation(integer,text,text,text) OWNER TO f6b20_owner;
REVOKE CREATE ON SCHEMA f6b20_synthetic FROM f6b20_owner;
GRANT USAGE ON SCHEMA f6b18_synthetic TO f6b20_owner;
GRANT EXECUTE ON FUNCTION f6b18_synthetic.norm_v1(text) TO f6b20_owner;
GRANT EXECUTE ON FUNCTION f6b20_synthetic.reserve_operation(integer,text,text,text) TO f6b20_caller;
DO $a$
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='f6b20_synthetic.operations'::regclass) THEN RAISE EXCEPTION 'RLS disabled'; END IF;
 IF (SELECT rolbypassrls OR rolsuper OR rolcreaterole FROM pg_roles WHERE rolname='f6b20_owner') THEN RAISE EXCEPTION 'owner privileges'; END IF;
 IF has_table_privilege('f6b20_caller','f6b20_synthetic.operations','SELECT') OR has_table_privilege('f6b20_caller','f6b20_synthetic.operations','INSERT') THEN RAISE EXCEPTION 'caller table grants'; END IF;
 IF has_function_privilege('f6b20_stranger','f6b20_synthetic.reserve_operation(integer,text,text,text)','EXECUTE') THEN RAISE EXCEPTION 'stranger execute'; END IF;
 IF pg_has_role('f6b20_caller','f6b20_owner','SET') THEN RAISE EXCEPTION 'escalation'; END IF;
END $a$;
