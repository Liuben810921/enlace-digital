#!/usr/bin/env python3
"""Offline assertions for recorded F0 staging metadata; never queries Supabase."""
from pathlib import Path
p=Path("docs/resultados-f0-metadatos-staging-lectura-2026-11-10.md").read_text(encoding="utf-8")
for i in range(1,13):
    assert f"F0-{i:02d}" in p, f"Missing F0-{i:02d}"
for token in ("xqahthghvozeigbojhyi","clientes_oficiales","clientes_destinatarios",
              "clientes_direcciones_entrega","int4","int8","NOT VALID",
              "ON DELETE CASCADE","RLS","SECURITY DEFINER","SECURITY INVOKER",
              "service_role","pg_depend","NORM-v1","NO-GO","Reversión",
              "no se consultó la base de producción","no DDL/DML"):
    assert token.lower() in p.lower(), f"Missing safeguard: {token}"
assert "no se probó serialización PostgREST" in p
assert "no hay cambios en Supabase" in p
print("PASS: F0 metadata audit: 12 checks, schema incompatibility, grants, sequences, no-go")
print("NOTE: documentary validation only, no database access")
