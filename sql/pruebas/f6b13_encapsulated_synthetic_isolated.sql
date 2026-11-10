-- F6-B13: isolated PostgreSQL synthetic-only security fixture. NEVER run on Supabase.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA f6b13_fixture;
CREATE ROLE f6b13_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b13_caller NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE f6b13_unauthorized NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE TABLE f6b13_fixture.direcciones (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 cliente_numero integer NOT NULL,
 provincia text NOT NULL,
 municipio text NOT NULL,
 barrio text NOT NULL DEFAULT '',
 direccion text NOT NULL
);
INSERT INTO f6b13_fixture.direcciones(cliente_numero,provincia,municipio,barrio,direccion)
VALUES (7,'La Habana','Plaza','','Calle Ficticia 100'),
       (7,'La Habana','Plaza','','Calle Ficticia 100'),
       (8,'La Habana','Plaza','','Calle Ficticia 100'),
       (7,'La Habana','Plaza','','Otra Calle 200');
ALTER TABLE f6b13_fixture.direcciones ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA f6b13_fixture TO f6b13_owner,f6b13_caller,f6b13_unauthorized;
GRANT SELECT(cliente_numero,provincia,municipio,barrio,direccion)
 ON f6b13_fixture.direcciones TO f6b13_owner;
CREATE POLICY f6b13_owner_only ON f6b13_fixture.direcciones
 FOR SELECT TO f6b13_owner USING (true);
-- CREATE on schema only for ownership transfer, revoked before any invocation.
GRANT CREATE ON SCHEMA f6b13_fixture TO f6b13_owner;
-- Toy NORM-v1 normalization. No production contract: full invalid-scalar/length handling remains NO-GO.
CREATE FUNCTION f6b13_fixture.norm_v1_toy(v text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT
SET search_path = pg_catalog, pg_temp
AS $norm$
 SELECT btrim(regexp_replace(translate(normalize(v,NFC),
   chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32) || chr(133) || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288),
   repeat(' ',25)), ' +', ' ', 'g'))
$norm$;
REVOKE ALL ON FUNCTION f6b13_fixture.norm_v1_toy(text) FROM PUBLIC;
ALTER FUNCTION f6b13_fixture.norm_v1_toy(text) OWNER TO f6b13_owner;
GRANT EXECUTE ON FUNCTION f6b13_fixture.norm_v1_toy(text) TO f6b13_owner;
CREATE FUNCTION f6b13_fixture.audit_suppressed()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE collision_seen boolean;
BEGIN
  -- Real values never returned; toy duplicate detection uses exact fixture strings.
  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT cliente_numero,
        convert_to(f6b13_fixture.norm_v1_toy(provincia),'UTF8') AS p,
        convert_to(f6b13_fixture.norm_v1_toy(municipio),'UTF8') AS m,
        convert_to(f6b13_fixture.norm_v1_toy(barrio),'UTF8') AS b,
        convert_to(f6b13_fixture.norm_v1_toy(direccion),'UTF8') AS d
      FROM f6b13_fixture.direcciones
      GROUP BY cliente_numero,p,m,b,d
      HAVING count(*) > 1
    ) AS g
  ) INTO collision_seen;
  RETURN 'SUPPRESSED';
EXCEPTION WHEN OTHERS THEN
  RETURN 'SUPPRESSED';
END;
$function$;
REVOKE ALL ON FUNCTION f6b13_fixture.audit_suppressed() FROM PUBLIC;
ALTER FUNCTION f6b13_fixture.audit_suppressed() OWNER TO f6b13_owner;
REVOKE CREATE ON SCHEMA f6b13_fixture FROM f6b13_owner;
GRANT EXECUTE ON FUNCTION f6b13_fixture.audit_suppressed() TO f6b13_caller;
DO $check$
BEGIN
 IF f6b13_fixture.norm_v1_toy(U&'Cafe\\0301') <> U&'Caf\\00E9' THEN RAISE EXCEPTION 'NFC mismatch'; END IF;
 IF f6b13_fixture.norm_v1_toy(U&' A\\00A0\\3000B ') <> 'A B' THEN RAISE EXCEPTION 'White_Space mismatch'; END IF;
 IF (SELECT count(*) FROM f6b13_fixture.direcciones) <> 4 THEN RAISE EXCEPTION 'fixture count mismatch'; END IF;
 IF NOT (SELECT EXISTS(SELECT 1 FROM f6b13_fixture.direcciones GROUP BY cliente_numero,provincia,municipio,barrio,direccion HAVING count(*)>1)) THEN
  RAISE EXCEPTION 'synthetic duplicate fixture missing';
 END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='f6b13_fixture' AND tablename='direcciones') <> 1 THEN RAISE EXCEPTION 'policy mismatch'; END IF;
 IF (SELECT prosecdef FROM pg_proc WHERE oid='f6b13_fixture.audit_suppressed()'::regprocedure) IS NOT TRUE THEN RAISE EXCEPTION 'not SECURITY DEFINER'; END IF;
 IF has_table_privilege('f6b13_caller','f6b13_fixture.direcciones','SELECT') THEN RAISE EXCEPTION 'caller direct SELECT granted'; END IF;
 IF has_column_privilege('f6b13_caller','f6b13_fixture.direcciones','direccion','SELECT') THEN RAISE EXCEPTION 'caller address SELECT granted'; END IF;
 IF has_column_privilege('f6b13_owner','f6b13_fixture.direcciones','id','SELECT') THEN RAISE EXCEPTION 'owner id SELECT granted'; END IF;
 IF NOT has_column_privilege('f6b13_owner','f6b13_fixture.direcciones','direccion','SELECT') THEN RAISE EXCEPTION 'owner missing column grant'; END IF;
 IF has_function_privilege('f6b13_unauthorized','f6b13_fixture.audit_suppressed()','EXECUTE') THEN RAISE EXCEPTION 'unauthorized EXECUTE'; END IF;
 IF NOT has_function_privilege('f6b13_caller','f6b13_fixture.audit_suppressed()','EXECUTE') THEN RAISE EXCEPTION 'caller EXECUTE missing'; END IF;
 IF (SELECT rolbypassrls OR rolsuper FROM pg_roles WHERE rolname='f6b13_owner') THEN RAISE EXCEPTION 'owner privileged'; END IF;
END; $check$;
SET ROLE f6b13_caller;
DO $test$
BEGIN
  IF f6b13_fixture.audit_suppressed() <> 'SUPPRESSED' THEN RAISE EXCEPTION 'leaked output'; END IF;
  BEGIN
    PERFORM direccion FROM f6b13_fixture.direcciones;
    RAISE EXCEPTION 'unexpected direct SELECT';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    EXECUTE 'UPDATE f6b13_fixture.direcciones SET barrio = ''''';
    RAISE EXCEPTION 'unexpected UPDATE';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END; $test$;
RESET ROLE;
SET ROLE f6b13_unauthorized;
DO $test$
BEGIN
 BEGIN
   PERFORM f6b13_fixture.audit_suppressed();
   RAISE EXCEPTION 'unexpected EXECUTE';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END; $test$;
RESET ROLE;
ROLLBACK;
\echo 'PASS F6-B13: isolated synthetic SECURITY DEFINER, RLS, privileges, SUPPRESSED; transaction rolled back'
