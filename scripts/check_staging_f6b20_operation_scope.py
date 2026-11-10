#!/usr/bin/env python3
"""F6-B20: fail-closed offline fixture scope check; no network/database."""
from pathlib import Path
sql=Path("sql/pruebas/f6b20_operation_idempotency_isolated.sql").read_text()
runner=Path("scripts/run_f6b20_operation_idempotency_isolated.py").read_text()
doc=Path("docs/f6b20-idempotencia-operacion-postgresql-aislado-2026-11-10.md").read_text()
workflow=Path(".github/workflows/f6b13-isolated-postgres-security.yml").read_text()
for token in ("CREATE SCHEMA f6b20_synthetic","PRIMARY KEY(client_id,operation_key)",
 "ENABLE ROW LEVEL SECURITY","SECURITY DEFINER","NOBYPASSRLS","REVOKE ALL ON FUNCTION",
 "ON CONFLICT (client_id,operation_key) DO NOTHING","REPLAY_SYNTHETIC",
 "CONFLICT_SYNTHETIC","NEW_SYNTHETIC","SET search_path=pg_catalog,pg_temp"):
    assert token in sql,token
for token in ("subprocess.Popen","ROLLBACK;","CONFLICT_SYNTHETIC",
 "REPLAY_SYNTHETIC","permission denied","count(6)"):
    assert token in runner,token
for i in range(1,11):
    assert f"B20-{i:02d}" in doc
for token in ("NO-GO","autorización A","autorización B","expiración conceptual",
 "digest","costos","histórica","RLS","identidad autenticada"):
    assert token.lower() in doc.lower(),token
assert "postgres:17" in workflow
assert "public.clientes_direcciones_entrega" not in sql+runner
print("PASS F6-B20: operation scope, concurrency, payload conflicts, no TTL and approvals")
