#!/usr/bin/env python3
"""Offline-only checks of inert orders transaction/concurrency proposal."""
from pathlib import Path

draft = Path("sql/propuestas/staging_pedidos_transacciones_concurrencia_no_ejecutar.sql").read_text()
schema = Path("sql/propuestas/staging_pedidos_oficiales_snapshot_no_ejecutar.sql").read_text()
plan = Path("docs/plan-concurrencia-pedidos-staging-no-ejecutar-2026-11-09.md").read_text()
shop = Path("staging-preview/index.html").read_text()
workflow = Path(".github/workflows/staging-auth-static-check.yml").read_text()

for name, text in (("transaction proposal", draft), ("schema proposal", schema)):
    assert all(not line.strip() or line.lstrip().startswith("--") for line in text.splitlines()), f"{name} contains executable SQL"
for marker in (
    "ed_pedido_crear_privado", "ed_pedido_transicionar_privado",
    "ed_pedido_verificar_pago_privado", "UNIQUE(cliente_numero,idempotency_key)",
    "request_sha256", "FOR UPDATE", "NUMERIC", "OWN stock", "SUPPLIER",
    "append-only", "expected_version", "VERSION_CONFLICT",
    "IDEMPOTENCY_CONFLICT", "OUT_OF_STOCK", "FORBIDDEN",
    "rollback", "sequences", "No external side effects",
):
    assert marker.lower() in draft.lower(), f"Missing transaction safeguard: {marker}"
for n in range(1, 13):
    marker = f"C{n:02d}"
    assert marker in plan, f"Missing concurrency case: {marker}"
for marker in ("ROLLBACK", "supervisor", "snapshot", "precio", "proveedor", "NO-GO"):
    assert marker.lower() in plan.lower(), f"Missing test-plan coverage: {marker}"
assert "const ED_REAL_CHECKOUT_ENABLED=false;" in shop
assert "python3 scripts/check_orders_transactions_contract.py" in workflow
print("PASS: inert transaction draft, 12 concurrency cases, safety gates, CI integration")
print("NOT RUN: SQL, concurrency, network, Supabase or live orders")
