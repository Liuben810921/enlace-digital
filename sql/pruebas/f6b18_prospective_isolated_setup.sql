-- F6-B18: synthetic, disposable PostgreSQL ONLY. NEVER Supabase.
\set ON_ERROR_STOP on
CREATE SCHEMA f6b18_synthetic;
CREATE ROLE f6b18_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b18_caller NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b18_stranger NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE TABLE f6b18_synthetic.prospective_keys(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL,
 p bytea NOT NULL, m bytea NOT NULL, b bytea NOT NULL, d bytea NOT NULL,
 CONSTRAINT f6b18_unique_new UNIQUE(cliente_numero,p,m,b,d)
);
ALTER TABLE f6b18_synthetic.prospective_keys ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA f6b18_synthetic TO f6b18_owner,f6b18_caller,f6b18_stranger;
GRANT SELECT,INSERT ON f6b18_synthetic.prospective_keys TO f6b18_owner;
GRANT USAGE ON SEQUENCE f6b18_synthetic.prospective_keys_id_seq TO f6b18_owner;
CREATE POLICY owner_access ON f6b18_synthetic.prospective_keys TO f6b18_owner USING (true) WITH CHECK (true);
GRANT CREATE ON SCHEMA f6b18_synthetic TO f6b18_owner;
CREATE FUNCTION f6b18_synthetic.norm_v1(s text) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog,pg_temp AS $fn$
DECLARE t text; c text; n integer; o text:=''; pending boolean:=false; i integer;
BEGIN
 t:=normalize(s,NFC);
 FOR i IN 1..char_length(t) LOOP
  c:=substr(t,i,1); n:=ascii(c);
  IF n=ANY(ARRAY[9,10,11,12,13,32,133,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288]) THEN
    pending:=char_length(o)>0;
  ELSIF n=8203 OR n=65279 OR n<32 OR (n>=127 AND n<=159) THEN
    RAISE EXCEPTION 'invalid field' USING ERRCODE='22023';
  ELSE
    IF pending THEN o:=o||' '; END IF;
    o:=o||c; pending:=false;
  END IF;
 END LOOP;
 RETURN o;
END $fn$;
REVOKE ALL ON FUNCTION f6b18_synthetic.norm_v1(text) FROM PUBLIC;
ALTER FUNCTION f6b18_synthetic.norm_v1(text) OWNER TO f6b18_owner;
CREATE FUNCTION f6b18_synthetic.keypart(s text, lo integer, hi integer) RETURNS bytea
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $fn$
DECLARE n text;
BEGIN
 IF s IS NULL THEN RAISE EXCEPTION 'invalid field' USING ERRCODE='22023'; END IF;
 n:=f6b18_synthetic.norm_v1(s);
 IF char_length(n)<lo OR char_length(n)>hi THEN RAISE EXCEPTION 'invalid field' USING ERRCODE='22023'; END IF;
 RETURN convert_to(n,'UTF8');
END $fn$;
REVOKE ALL ON FUNCTION f6b18_synthetic.keypart(text,integer,integer) FROM PUBLIC;
ALTER FUNCTION f6b18_synthetic.keypart(text,integer,integer) OWNER TO f6b18_owner;
CREATE FUNCTION f6b18_synthetic.reserve_new(c integer, provincia text, municipio text, barrio text, direccion text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $fn$
DECLARE inserted bigint;
BEGIN
 IF c IS NULL OR c<=0 THEN RAISE EXCEPTION 'invalid client' USING ERRCODE='22023'; END IF;
 INSERT INTO f6b18_synthetic.prospective_keys(cliente_numero,p,m,b,d)
 VALUES(c,
  f6b18_synthetic.keypart(provincia,2,100),
  f6b18_synthetic.keypart(municipio,2,100),
  f6b18_synthetic.keypart(barrio,0,150),
  f6b18_synthetic.keypart(direccion,8,500))
 ON CONFLICT ON CONSTRAINT f6b18_unique_new DO NOTHING
 RETURNING id INTO inserted;
 IF inserted IS NULL THEN RETURN 'DUPLICATE_SYNTHETIC'; END IF;
 RETURN 'RESERVED_SYNTHETIC';
END $fn$;
REVOKE ALL ON FUNCTION f6b18_synthetic.reserve_new(integer,text,text,text,text) FROM PUBLIC;
ALTER FUNCTION f6b18_synthetic.reserve_new(integer,text,text,text,text) OWNER TO f6b18_owner;
REVOKE CREATE ON SCHEMA f6b18_synthetic FROM f6b18_owner;
GRANT EXECUTE ON FUNCTION f6b18_synthetic.reserve_new(integer,text,text,text,text) TO f6b18_caller;
DO $assert$
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='f6b18_synthetic.prospective_keys'::regclass) THEN RAISE EXCEPTION 'RLS off'; END IF;
 IF (SELECT rolbypassrls OR rolsuper OR rolcreaterole FROM pg_roles WHERE rolname='f6b18_owner') THEN RAISE EXCEPTION 'privileged owner'; END IF;
 IF has_table_privilege('f6b18_caller','f6b18_synthetic.prospective_keys','SELECT') THEN RAISE EXCEPTION 'direct SELECT'; END IF;
 IF has_table_privilege('f6b18_caller','f6b18_synthetic.prospective_keys','INSERT') THEN RAISE EXCEPTION 'direct INSERT'; END IF;
 IF has_function_privilege('f6b18_stranger','f6b18_synthetic.reserve_new(integer,text,text,text,text)','EXECUTE') THEN RAISE EXCEPTION 'stranger EXECUTE'; END IF;
 IF has_schema_privilege('f6b18_caller','f6b18_synthetic','CREATE') THEN RAISE EXCEPTION 'caller CREATE'; END IF;
 IF pg_has_role('f6b18_caller','f6b18_owner','SET') THEN RAISE EXCEPTION 'role escalation'; END IF;
END $assert$;
