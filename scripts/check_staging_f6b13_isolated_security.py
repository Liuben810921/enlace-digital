#!/usr/bin/env python3
"""F6-B13 fail-closed static guard. No network and no SQL execution."""
from pathlib import Path
sql=Path("sql/pruebas/f6b13_encapsulated_synthetic_isolated.sql").read_text(encoding="utf-8")
doc=Path("docs/f6b13-prototipo-postgresql-encapsulado-aislado-2026-11-10.md").read_text(encoding="utf-8")
wf=Path(".github/workflows/f6b13-isolated-postgres-security.yml").read_text(encoding="utf-8")
for token in ("BEGIN;","ROLLBACK;","CREATE ROLE f6b13_owner NOLOGIN","CREATE ROLE f6b13_caller NOLOGIN",
              "CREATE POLICY f6b13_owner_only","SECURITY DEFINER","SET search_path = pg_catalog, pg_temp",
              "REVOKE ALL ON FUNCTION","GRANT EXECUTE ON FUNCTION","SET ROLE f6b13_caller",
              "SET ROLE f6b13_unauthorized","has_column_privilege","has_function_privilege",
              "insufficient_privilege","SUPPRESSED","normalize(v,NFC)","convert_to("):
    assert token in sql,token
assert sql.count("ROLLBACK;")==1
assert "public.clientes_direcciones_entrega" not in sql
assert "xqahthghvozeigbojhyi" not in sql
assert "service_role" not in sql
assert "postgres:17" in wf and "synthetic_ci_only" in wf
assert "psql -X -v ON_ERROR_STOP=1" in wf
for i in range(1,11):
    assert f"B13-{i:02d}" in doc
for t in ("NO-GO","NO ES NORM-v1 completo","Autorización A","autorización B","ROLLBACK","GitHub Actions"):
    assert t in doc,t
print("PASS F6-B13 static isolation, synthetic SQL guards and separate authorization")
