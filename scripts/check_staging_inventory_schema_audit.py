#!/usr/bin/env python3
"""Offline checks of documented read-only staging findings; no database calls."""
from pathlib import Path
report=Path("docs/auditoria-esquema-inventario-supabase-staging-lectura-2026-11-10.md").read_text(encoding="utf-8")
plan=Path("docs/plan-migracion-inventario-reservas-staging-no-ejecutar-2026-11-10.md").read_text(encoding="utf-8")
for marker in (
    "xqahthghvozeigbojhyi", "clientes_oficiales", "clientes_destinatarios",
    "clientes_direcciones_entrega", "public.productos", "public.pedidos_oficiales",
    "public.inventario_variantes", "integer/int4", "service_role", "false",
    "RLS", "NO-GO", "no es posible", "no se efectuó lectura de datos personales",
):
    assert marker.lower() in report.lower(), f"Missing audit evidence: {marker}"
for marker in ("no existen", "no puede aplicarse", "integer/int4", "service_role"):
    assert marker in plan, f"Migration plan missing staging blocker: {marker}"
assert "No se pudieron evaluar datos de variantes" in plan
print("PASS: staging catalog/order absence, privilege caveats, migration NO-GO")
print("NOTE: static validation of recorded findings, not a live database test")
