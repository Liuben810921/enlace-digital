#!/usr/bin/env python3
"""F6-B18 offline-only guard for disposable PostgreSQL concurrency fixture."""
from pathlib import Path
sql=Path("sql/pruebas/f6b18_prospective_isolated_setup.sql").read_text()
runner=Path("scripts/run_f6b18_concurrency_isolated.py").read_text()
doc=Path("docs/f6b18-concurrencia-deduplicacion-prospectiva-postgresql-aislado-2026-11-10.md").read_text()
wf=Path(".github/workflows/f6b13-isolated-postgres-security.yml").read_text()
for token in ("CREATE SCHEMA f6b18_synthetic","NOBYPASSRLS","ENABLE ROW LEVEL SECURITY",
              "CREATE POLICY owner_access","SECURITY DEFINER","ON CONFLICT ON CONSTRAINT",
              "REVOKE ALL ON FUNCTION","GRANT EXECUTE","SET search_path=pg_catalog,pg_temp",
              "normalize(s,NFC)","convert_to(n,'UTF8')"):
    assert token in sql,token
for token in ("subprocess.Popen","pg_stat_activity","pg_sleep(3)","DUPLICATE_SYNTHETIC",
              "RESERVED_SYNTHETIC","ROLLBACK;","permission denied","count(3)"):
    assert token in runner,token
for i in range(1,11):
    assert f"B18-{i:02d}" in doc
for token in ("NO-GO","Autorización A","Autorización B","históricos","idempotencia",
              "GitHub Actions","costo gratuito","rollback"):
    assert token.lower() in doc.lower(),token
assert "postgres:17" in wf
assert "public.clientes_direcciones_entrega" not in sql+runner
assert "xqahthghvozeigbojhyi" not in sql+runner
print("PASS F6-B18 static: isolated two-session prospective deduplication and approvals")
