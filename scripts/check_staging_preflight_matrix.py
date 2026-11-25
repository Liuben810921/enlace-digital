#!/usr/bin/env python3
"""Offline preflight matrix contract checks. No SQL or database connection."""
from pathlib import Path
p=Path("docs/matriz-preflight-migraciones-staging-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
manifest=Path("docs/especificacion-unica-migraciones-staging-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
shop=Path("staging-preview/index.html").read_text(encoding="utf-8")
for n in range(1,21):
    assert f"| P{n:02d} |" in p, f"Missing preflight control P{n:02d}"
for n in range(10):
    assert f"G{n:02d}" in p and f"| G{n:02d} |" in manifest, f"Missing migration phase G{n:02d}"
for token in (
    "information_schema.tables", "information_schema.columns", "pg_constraint",
    "pg_class.relrowsecurity", "pg_policies", "has_table_privilege", "pg_proc",
    "clientes_oficiales.numero integer", "cliente_numero integer", "bigint/int8",
    "variantes_color", "stock_reservado <= stock_fisico", "Number.MAX_SAFE_INTEGER",
    "service_role", "SECURITY DEFINER", "search_path", "ED_REAL_CHECKOUT_ENABLED=false",
    "PENDIENTE", "NO-GO", "Reversión", "no consulta a Supabase",
):
    assert token.lower() in p.lower(), f"Missing preflight safeguard: {token}"
assert "ED_REAL_CHECKOUT_ENABLED=false" in shop
assert "P01–P20 = `PENDIENTE`" in p
print("PASS: 20 preflight controls, G00-G09 phase mapping, security and rollback gates")
print("NOTE: offline documentary verification only; no database queries or SQL executed")
