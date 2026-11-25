#!/usr/bin/env python3
"""Static-only contract checks. No SQL execution, database, or HTTP."""
from pathlib import Path
sql = Path("sql/propuestas/staging_migracion_inventario_reservas_borrador_no_ejecutar.sql").read_text(encoding="utf-8")
doc = Path("docs/plan-migracion-inventario-reservas-staging-no-ejecutar-2026-11-10.md").read_text(encoding="utf-8")
assert all(not line.strip() or line.lstrip().startswith("--") for line in sql.splitlines()), "Executable SQL detected"
for marker in (
    "CREATE TABLE public.inventario_variantes", "CREATE TABLE public.inventario_reservas",
    "CREATE TABLE public.inventario_movimientos", "variant_id uuid PRIMARY KEY",
    "stock_reservado <= stock_fisico", "UNIQUE (producto_id, nombre_normalizado)",
    "UNIQUE (pedido_id, producto_id, variant_id)", "ON DELETE RESTRICT",
    "REVOKE ALL", "ROW LEVEL SECURITY", "SECURITY DEFINER",
    "FOR UPDATE", "ROLLBACK", "procurement_pending", "idempotency",
    "legacy", "NO-GO",
):
    assert marker in sql, f"Missing migration invariant: {marker}"
for marker in (
    "Unicode NFC", "cantidad=0", "stock_reservado", "append-only",
    "NO-GO", "Rollback completo", "Ledger preservado",
):
    assert marker in doc, f"Missing plan safeguard: {marker}"
for i in range(1, 17):
    assert f"| M{i:02d} |" in doc, f"Missing scenario M{i:02d}"
assert "no se ha ejecutado sql" in doc.lower()
print("PASS: commented migration proposal, compatibility gates, security, rollback, 16 scenarios")
print("NOTE: no SQL or concurrency test was executed")
