#!/usr/bin/env python3
"""Pure offline assertions for proposed orders API contract. No network, no SQL execution."""
from pathlib import Path

contract = Path("docs/contrato-api-pedidos-oficiales-no-ejecutable-2026-11-09.md").read_text(encoding="utf-8")
design = Path("sql/propuestas/staging_pedidos_oficiales_snapshot_no_ejecutar.sql").read_text(encoding="utf-8")
shop = Path("staging-preview/index.html").read_text(encoding="utf-8")

assert all(not line.strip() or line.lstrip().startswith("--") for line in design.splitlines()), "SQL draft must be inert"
for term in (
    "create-order", "get-own-order", "list-own-orders", "list-admin-orders",
    "get-admin-order", "transition-order", "verify-payment",
    "departamentos_admins", "principal", "general", "operativo", "supervisor",
    "Solo lectura", "idempotency_key", "IDEMPOTENCY_CONFLICT", "VERSION_CONFLICT",
    "OUT_OF_STOCK", "PRODUCT_UNAVAILABLE", "SUPPLIER_UNCONFIRMED",
    "ORDERS_DISABLED", "UNAUTHENTICATED", "FORBIDDEN", "RATE_LIMITED",
    "numeric(14,2)", "entrega_direccion", "append-only", "compare-and-swap",
    "rollback", "origen_producto='propio'", "origen_producto='proveedor'",
    "No hay permisos administrativos implícitos", "NO-GO",
):
    assert term in contract, f"Missing API contract safeguard: {term}"
assert "const ED_REAL_CHECKOUT_ENABLED=false;" in shop
assert "function edConfirmSimulatedCheckout()" in shop
assert "/rest/v1/pedidos_oficiales?select=" in shop
assert "No se crea pedido" in contract or "no se crea pedido" in contract
assert "no descontar" in contract
assert "no confiar" in contract.lower() or "no transmite" in contract
assert "No hay correos, cobros" in contract
print("PASS: API contract guards, roles, idempotency, inventory, rollback, disabled checkout")
print("NOTE: documentation checks only; no HTTP, SQL or business logic executed")
