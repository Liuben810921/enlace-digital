#!/usr/bin/env python3
"""Offline checks for inventory variant and cancellation contracts. No SQL or HTTP."""
from pathlib import Path

html = Path("staging-preview/index.html").read_text(encoding="utf-8")
doc = Path("docs/auditoria-variantes-reservas-cancelaciones-offline-2026-11-09.md").read_text(encoding="utf-8")
sql = Path("sql/propuestas/staging_pedidos_transacciones_concurrencia_no_ejecutar.sql").read_text(encoding="utf-8")
assert all(not x.strip() or x.lstrip().startswith("--") for x in sql.splitlines()), "SQL must remain inert"
for marker in (
    "variantes_color:p.colors||[]", "colors:Array.isArray(p.variantes_color)?p.variantes_color:[]",
    "p.origen_producto==='proveedor'?null:p.cantidad",
    "p.origen_producto==='proveedor'?0:(p.qty??0)",
    "function isSupplier(p)", "function isAvailable(p)", "function canOrder(p,n,color)",
    "function validateCart()", "function updateDemoOrder(id,field,value)",
    "p.colors.reduce((n,v)=>n+v.qty,0)",
):
    assert marker in html, f"Existing catalog contract changed: {marker}"
for marker in (
    "fuente de verdad", "variant_id", "procurement_pending", "SELECT ... FOR UPDATE",
    "idempotency_key", "NO-GO", "Rollback completo", "Una liberación",
    "No reponer automáticamente", "Stock independiente", "Sin decremento",
):
    assert marker in doc, f"Missing documented safety invariant: {marker}"
for i in range(1, 13):
    assert f"| V{i:02d} |" in doc, f"Missing variant test scenario V{i:02d}"
assert "ED_REAL_CHECKOUT_ENABLED=false;" in html
print("PASS: catalog variants, own/supplier distinction, 12 offline scenario contracts, inert SQL")
print("NOTE: no concurrency or database behavior was executed")
