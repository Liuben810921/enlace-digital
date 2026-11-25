#!/usr/bin/env python3
"""F6-B14: generate isolated PostgreSQL synthetic test SQL from 30 Unicode fixtures.
No network, credentials, real customers or Supabase. Output is SQL for disposable CI only.
"""
import json
from pathlib import Path

data=json.loads(Path("tests/fixtures/norm_v1_utf8_vectors.json").read_text(encoding="utf-8"))
assert len(data["cases"])==30
ws=[int(v,16) for v in data["unicode_whitespace_hex"]]
assert len(ws)==25 and len(set(ws))==25
assert {c["id"] for c in data["cases"]}=={f"V{i:02d}" for i in range(1,31)}
transport=[]; boundary=[]
for c in data["cases"]:
    if any(0xD800<=ord(ch)<=0xDFFF for ch in c["input"]):
        assert c["reject"] and c["id"] in ("V21","V22")
        try:
            c["input"].encode("utf-8")
        except UnicodeEncodeError:
            boundary.append(c["id"])
        else:
            raise AssertionError("Invalid scalar unexpectedly transportable")
    else:
        transport.append(c)
assert len(transport)==28 and boundary==["V21","V22"]
sql=r"""-- F6-B14 isolated synthetic-only generated SQL. Never use in Supabase.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA f6b14_fixture;
CREATE ROLE f6b14_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b14_caller NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b14_unauthorized NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE TABLE f6b14_fixture.direcciones(
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL,
 provincia text NOT NULL,
 municipio text NOT NULL,
 barrio text NOT NULL,
 direccion text NOT NULL
);
INSERT INTO f6b14_fixture.direcciones(cliente_numero,provincia,municipio,barrio,direccion)
VALUES (7,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 100'),
       (7,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 100'),
       (8,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 100'),
       (7,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 200');
ALTER TABLE f6b14_fixture.direcciones ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA f6b14_fixture TO f6b14_owner,f6b14_caller,f6b14_unauthorized;
GRANT SELECT(cliente_numero,provincia,municipio,barrio,direccion) ON f6b14_fixture.direcciones TO f6b14_owner;
CREATE POLICY f6b14_owner_select ON f6b14_fixture.direcciones FOR SELECT TO f6b14_owner USING (true);
GRANT CREATE ON SCHEMA f6b14_fixture TO f6b14_owner;
CREATE FUNCTION f6b14_fixture.norm_v1(s text) RETURNS text
LANGUAGE plpgsql IMMUTABLE STRICT
SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE t text; c text; n int; o text := ''; pending boolean := false; i integer;
BEGIN
 t := normalize(s,NFC);
 FOR i IN 1..char_length(t) LOOP
  c := substr(t,i,1); n := ascii(c);
  IF n = ANY(ARRAY[9,10,11,12,13,32,133,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288]) THEN
    pending := char_length(o)>0;
  ELSIF n=8203 OR n=65279 OR n<32 OR (n>=127 AND n<=159) THEN
    RAISE EXCEPTION 'invalid codepoint' USING ERRCODE='22023';
  ELSE
    IF pending THEN o:=o||' '; END IF;
    o:=o||c; pending:=false;
  END IF;
 END LOOP;
 RETURN o;
END;
$fn$;
REVOKE ALL ON FUNCTION f6b14_fixture.norm_v1(text) FROM PUBLIC;
ALTER FUNCTION f6b14_fixture.norm_v1(text) OWNER TO f6b14_owner;
CREATE FUNCTION f6b14_fixture.valid_field(s text, minimum integer, maximum integer)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE
SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE normalized text;
BEGIN
 IF s IS NULL THEN RAISE EXCEPTION 'invalid field' USING ERRCODE='22023'; END IF;
 normalized:=f6b14_fixture.norm_v1(s);
 IF char_length(normalized)<minimum OR char_length(normalized)>maximum THEN
   RAISE EXCEPTION 'invalid field' USING ERRCODE='22023';
 END IF;
 RETURN convert_to(normalized,'UTF8');
END;
$fn$;
REVOKE ALL ON FUNCTION f6b14_fixture.valid_field(text,integer,integer) FROM PUBLIC;
ALTER FUNCTION f6b14_fixture.valid_field(text,integer,integer) OWNER TO f6b14_owner;
CREATE FUNCTION f6b14_fixture.audit_suppressed() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE found_collision boolean;
BEGIN
 SELECT EXISTS (
  SELECT 1 FROM (
   SELECT cliente_numero,
     f6b14_fixture.valid_field(provincia,2,100) p,
     f6b14_fixture.valid_field(municipio,2,100) m,
     f6b14_fixture.valid_field(barrio,0,150) b,
     f6b14_fixture.valid_field(direccion,8,500) d
   FROM f6b14_fixture.direcciones
   GROUP BY cliente_numero,p,m,b,d
   HAVING count(*)>1
  ) g
 ) INTO found_collision;
 RETURN 'SUPPRESSED';
EXCEPTION WHEN OTHERS THEN
 RETURN 'SUPPRESSED';
END;
$fn$;
REVOKE ALL ON FUNCTION f6b14_fixture.audit_suppressed() FROM PUBLIC;
ALTER FUNCTION f6b14_fixture.audit_suppressed() OWNER TO f6b14_owner;
REVOKE CREATE ON SCHEMA f6b14_fixture FROM f6b14_owner;
GRANT EXECUTE ON FUNCTION f6b14_fixture.audit_suppressed() TO f6b14_caller;
CREATE TEMP TABLE synthetic_vectors(id text PRIMARY KEY, actual text);
"""
for c in transport:
    h=c["input"].encode("utf-8").hex()
    sql+=f"""DO $case$ BEGIN
 BEGIN
  INSERT INTO synthetic_vectors VALUES ('{c["id"]}',encode(convert_to(f6b14_fixture.norm_v1(convert_from(decode('{h}','hex'),'UTF8')),'UTF8'),'hex'));
 EXCEPTION WHEN OTHERS THEN
  INSERT INTO synthetic_vectors VALUES ('{c["id"]}','REJECT');
 END;
END; $case$;
"""
for c in transport:
    expected="REJECT" if c.get("reject") else c["output_hex"]
    sql+=f"""DO $check$ BEGIN
 IF (SELECT actual FROM synthetic_vectors WHERE id='{c["id"]}') IS DISTINCT FROM '{expected}' THEN
  RAISE EXCEPTION 'fixture mismatch {c["id"]}';
 END IF;
END; $check$;
"""
sql+=r"""
DO $assert$
DECLARE blocked boolean; state text;
BEGIN
 IF (SELECT count(*) FROM synthetic_vectors) <> 28 THEN RAISE EXCEPTION 'vector count'; END IF;
 IF (SELECT rolbypassrls OR rolsuper OR rolcreaterole OR rolcreatedb FROM pg_roles WHERE rolname='f6b14_owner') THEN RAISE EXCEPTION 'owner escalated'; END IF;
 IF has_table_privilege('f6b14_caller','f6b14_fixture.direcciones','SELECT') OR has_column_privilege('f6b14_caller','f6b14_fixture.direcciones','direccion','SELECT') THEN RAISE EXCEPTION 'caller direct read'; END IF;
 IF has_column_privilege('f6b14_owner','f6b14_fixture.direcciones','id','SELECT') THEN RAISE EXCEPTION 'owner id read'; END IF;
 IF NOT has_column_privilege('f6b14_owner','f6b14_fixture.direcciones','direccion','SELECT') THEN RAISE EXCEPTION 'owner missing column'; END IF;
 IF has_function_privilege('f6b14_unauthorized','f6b14_fixture.audit_suppressed()','EXECUTE') THEN RAISE EXCEPTION 'unauthorized execute'; END IF;
 IF NOT has_function_privilege('f6b14_caller','f6b14_fixture.audit_suppressed()','EXECUTE') THEN RAISE EXCEPTION 'missing execute'; END IF;
 IF NOT (SELECT prosecdef FROM pg_proc WHERE oid='f6b14_fixture.audit_suppressed()'::regprocedure) THEN RAISE EXCEPTION 'not security definer'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='f6b14_fixture' AND tablename='direcciones') <> 1 THEN RAISE EXCEPTION 'rls policy mismatch'; END IF;
 IF f6b14_fixture.valid_field('   ',0,150) IS DISTINCT FROM ''::bytea THEN RAISE EXCEPTION 'optional barrio'; END IF;
 IF f6b14_fixture.valid_field(U&'Cafe\0301',1,100) IS DISTINCT FROM convert_to(U&'Caf\00E9','UTF8') THEN RAISE EXCEPTION 'NFC byte mismatch'; END IF;
 IF f6b14_fixture.audit_suppressed()<>'SUPPRESSED' THEN RAISE EXCEPTION 'suppression mismatch'; END IF;
 -- Negative checks must not catch their own sentinel: only SQLSTATE 42501 is accepted.
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.valid_field(NULL,0,150);
 EXCEPTION WHEN SQLSTATE '22023' THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'NULL not rejected'; END IF;
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.valid_field('x',2,100);
 EXCEPTION WHEN SQLSTATE '22023' THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'short field not rejected'; END IF;
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.valid_field(repeat('x',501),8,500);
 EXCEPTION WHEN SQLSTATE '22023' THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'long field not rejected'; END IF;
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.valid_field(U&'a\200Bb',1,100);
 EXCEPTION WHEN SQLSTATE '22023' THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'zero width not rejected'; END IF;
END; $assert$;
SET ROLE f6b14_caller;
DO $assert$
DECLARE blocked boolean;
BEGIN
 IF f6b14_fixture.audit_suppressed()<>'SUPPRESSED' THEN RAISE EXCEPTION 'caller leaked result'; END IF;
 blocked:=false;
 BEGIN
  PERFORM direccion FROM f6b14_fixture.direcciones;
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'direct SELECT unexpectedly allowed'; END IF;
 blocked:=false;
 BEGIN
  UPDATE f6b14_fixture.direcciones SET barrio='';
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'UPDATE unexpectedly allowed'; END IF;
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.norm_v1('fake');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'normalizer EXECUTE unexpectedly allowed'; END IF;
END; $assert$;
RESET ROLE;
SET ROLE f6b14_unauthorized;
DO $assert$
DECLARE blocked boolean;
BEGIN
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.audit_suppressed();
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'unauthorized EXECUTE unexpectedly allowed'; END IF;
END; $assert$;
RESET ROLE;
ROLLBACK;
\echo 'PASS F6-B14: 28 PostgreSQL transportable vectors, 2 UTF-8 boundary rejects, negative privileges, RLS and SUPPRESSED'
"""
Path("/tmp/f6b14_synthetic_generated.sql").write_text(sql,encoding="utf-8")
print("PASS generated synthetic F6-B14 SQL: 28 PostgreSQL cases, 2 rejected UTF-8 boundary")
