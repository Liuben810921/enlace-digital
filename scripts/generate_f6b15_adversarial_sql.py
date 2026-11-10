#!/usr/bin/env python3
"""F6-B15 adversarial extension for disposable PostgreSQL only.
Requires B14-generated SQL; no external connections, no staging, no customer data.
"""
from pathlib import Path
path=Path("/tmp/f6b14_synthetic_generated.sql")
base=path.read_text(encoding="utf-8")
assert base.count("\nROLLBACK;")==1
extension=r"""
-- F6-B15 adversarial-only tests. All objects are synthetic and rolled back.
DO $b15$
DECLARE i integer; output text; blocked boolean; function_owner text; config text[];
BEGIN
 SELECT pg_get_userbyid(proowner),proconfig INTO function_owner,config
 FROM pg_proc WHERE oid='f6b14_fixture.audit_suppressed()'::regprocedure;
 IF function_owner<>'f6b14_owner' THEN RAISE EXCEPTION 'B15 wrong function owner'; END IF;
 IF NOT ('search_path=pg_catalog, pg_temp'=ANY(config)) THEN RAISE EXCEPTION 'B15 unsafe search_path'; END IF;
 IF NOT (SELECT relrowsecurity AND NOT relforcerowsecurity FROM pg_class WHERE oid='f6b14_fixture.direcciones'::regclass) THEN
  RAISE EXCEPTION 'B15 RLS setting unexpected';
 END IF;
 IF has_schema_privilege('f6b14_caller','f6b14_fixture','CREATE') THEN RAISE EXCEPTION 'B15 caller CREATE allowed'; END IF;
 IF has_schema_privilege('f6b14_owner','f6b14_fixture','CREATE') THEN RAISE EXCEPTION 'B15 owner CREATE allowed'; END IF;
 IF pg_has_role('f6b14_caller','f6b14_owner','MEMBER') THEN RAISE EXCEPTION 'B15 caller inherited owner'; END IF;
 IF has_function_privilege('public','f6b14_fixture.audit_suppressed()','EXECUTE') THEN RAISE EXCEPTION 'B15 PUBLIC execute'; END IF;
 -- Invalid record: error must be suppressed, without returning an exception or a count.
 INSERT INTO f6b14_fixture.direcciones(cliente_numero,provincia,municipio,barrio,direccion)
 VALUES(11,'Provincia Ficticia','Municipio Ficticio','',U&'Calle\200B Inventada 333');
 FOR i IN 1..12 LOOP
   output:=f6b14_fixture.audit_suppressed();
   IF output IS DISTINCT FROM 'SUPPRESSED' THEN RAISE EXCEPTION 'B15 invalid record leaked'; END IF;
 END LOOP;
 DELETE FROM f6b14_fixture.direcciones WHERE cliente_numero=11;
 -- A second data state must not change observable returned text.
 FOR i IN 1..12 LOOP
   output:=f6b14_fixture.audit_suppressed();
   IF output IS DISTINCT FROM 'SUPPRESSED' THEN RAISE EXCEPTION 'B15 valid record leaked'; END IF;
 END LOOP;
END; $b15$;
SET ROLE f6b14_caller;
DO $b15$
DECLARE i integer; blocked boolean;
BEGIN
 FOR i IN 1..12 LOOP
   IF f6b14_fixture.audit_suppressed() IS DISTINCT FROM 'SUPPRESSED' THEN
    RAISE EXCEPTION 'B15 caller output leaked';
   END IF;
 END LOOP;
 blocked:=false;
 BEGIN
  EXECUTE 'SET ROLE f6b14_owner';
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'B15 caller role escalation allowed'; END IF;
 blocked:=false;
 BEGIN
  EXECUTE 'CREATE TABLE f6b14_fixture.evil(x int)';
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'B15 caller schema CREATE allowed'; END IF;
 blocked:=false;
 BEGIN
  EXECUTE 'GRANT SELECT ON f6b14_fixture.direcciones TO f6b14_caller';
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'B15 caller GRANT escalation allowed'; END IF;
 blocked:=false;
 BEGIN
  PERFORM f6b14_fixture.valid_field('Calle Inventada',8,500);
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'B15 internal function EXECUTE allowed'; END IF;
END; $b15$;
RESET ROLE;
SET ROLE f6b14_unauthorized;
DO $b15$
DECLARE i integer; blocked boolean;
BEGIN
 FOR i IN 1..5 LOOP
  blocked:=false;
  BEGIN
   PERFORM f6b14_fixture.audit_suppressed();
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'B15 unauthorized repeat EXECUTE allowed'; END IF;
 END LOOP;
END; $b15$;
RESET ROLE;
"""
base=base.replace("\nROLLBACK;", "\n"+extension+"\nROLLBACK;")
path2=Path("/tmp/f6b15_adversarial_generated.sql")
path2.write_text(base,encoding="utf-8")
print("PASS F6-B15 generated: repeated suppression, invalid record, RLS, owner, privilege escalation and denial assertions")
