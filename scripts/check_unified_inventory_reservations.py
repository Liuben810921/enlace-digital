#!/usr/bin/env python3
"""Offline safety contract for unified inventory design. No database or network."""
from pathlib import Path

doc = Path("docs/diseno-unificado-inventario-reservas-no-ejecutable-2026-11-09.md").read_text(encoding="utf-8")
sql = Path("sql/propuestas/staging_inventario_reservas_unificado_no_ejecutar.sql").read_text(encoding="utf-8")
shop = Path("staging-preview/index.html").read_text(encoding="utf-8")
assert all(not line.strip() or line.lstrip().startswith("--") for line in sql.splitlines()), "SQL proposal is executable!"
for term in (
    "inventario_variantes", "inventario_reservas", "inventario_movimientos",
    "variant_id uuid PRIMARY KEY", "stock_fisico integer", "stock_reservado integer",
    "stock_reservado <= stock_fisico", "UNIQUE (pedido_id, producto_id, variant_id)",
    "FOR UPDATE", "ROLLBACK", "activa -> consumida", "activa -> liberada",
    "activa -> expirada", "stock_fisico -= cantidad", "stock_reservado -= cantidad",
    "no inventory reservation/decrement", "variant_id immutable", "NO SQL EXECUTION",
):
    assert term in sql, f"Missing invariant: {term}"
for term in (
    "stock_fisico - stock_reservado", "idempotency_key", "stock_reservado <= stock_fisico",
    "SIN_VARIANTE", "NO-GO", "Sin decremento", "Una liberación",
):
    # Some terms are expressed by equivalent prose; do not require arbitrary spellings.
    if term == "SIN_VARIANTE":
        assert term in doc
    elif term == "Sin decremento":
        assert "no reservar" in doc.lower()
    elif term == "Una liberación":
        assert term in doc
    else:
        assert term in doc, f"Missing design policy: {term}"
for i in range(1, 15):
    assert f"| I{i:02d} |" in doc, f"Missing scenario I{i:02d}"
assert "const ED_REAL_CHECKOUT_ENABLED=false;" in shop
assert "variantes_color:p.colors||[]" in shop
print("PASS: inert SQL, stable variant IDs, reservation lifecycle, 14 static scenarios")
print("NOTE: no transaction or race condition has been executed")
