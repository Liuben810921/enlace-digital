#!/usr/bin/env python3
"""Offline verification of the canonical non-executable staged implementation plan."""
from pathlib import Path
p=Path("docs/plan-maestro-catalogo-pedidos-inventario-reservas-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
shop=Path("staging-preview/index.html").read_text(encoding="utf-8")
schema=Path("sql/propuestas/staging_catalogo_contrato_completo_no_ejecutar.sql").read_text(encoding="utf-8")
for field in ("id","nombre","marca","modelo","descripcion","categoria","precio_usd",
              "cantidad","disponible","imagenes","especificaciones","origen_producto",
              "archivado","variantes_color","updated_at"):
    assert field in p and field in schema, f"Missing full catalog field: {field}"
for phase in range(7):
    assert f"**F{phase} " in p, f"Missing phase F{phase}"
for case in range(1,19):
    assert f"| U{case:02d} |" in p, f"Missing acceptance U{case:02d}"
for invariant in ("cliente_numero integer", "variant_id", "stock_fisico",
                  "stock_reservado", "UNIQUE(cliente_numero,idempotency_key)",
                  "request_sha256", "service_role", "SECURITY DEFINER",
                  "NO-GO", "append-only", "Reversión", "proveedor",
                  "Number.MAX_SAFE_INTEGER", "ED_REAL_CHECKOUT_ENABLED=false"):
    assert invariant in p, f"Missing master safeguard: {invariant}"
assert "ED_REAL_CHECKOUT_ENABLED=false" in shop
assert all(not line.strip() or line.lstrip().startswith("--") for line in schema.splitlines())
print("PASS: canonical phases F0-F6, 18 acceptance cases, catalog fields, security and rollback")
print("NOTE: documentation/static only; no SQL or live concurrency checks")
