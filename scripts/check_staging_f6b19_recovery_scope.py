#!/usr/bin/env python3
"""F6-B19 offline scope and failure recovery gates; no database access."""
from pathlib import Path
runner=Path("scripts/run_f6b19_recovery_isolated.py").read_text()
doc=Path("docs/f6b19-recuperacion-reintentos-idempotencia-postgresql-aislado-2026-11-10.md").read_text()
workflow=Path(".github/workflows/f6b13-isolated-postgres-security.yml").read_text()
for token in ("first.kill()","ROLLBACK;","ROLLBACK TO SAVEPOINT","pg_stat_activity",
              "DUPLICATE_SYNTHETIC","RESERVED_SYNTHETIC","permission denied",
              "pg_has_role","relrowsecurity","count(3)"):
    assert token in runner,token
for i in range(1,11):
    assert f"B19-{i:02d}" in doc
for token in ("NO-GO","Autorización A","autorización B","histor","idempotencia",
              "SUPPRESSED","GitHub Actions","rollback","RLS"):
    assert token.lower() in doc.lower(),token
assert "postgres:17" in workflow
assert "public.clientes_direcciones_entrega" not in runner
assert "xqahthghvozeigbojhyi" not in runner
print("PASS F6-B19: synthetic recovery and separate staging/history authorization gates")
