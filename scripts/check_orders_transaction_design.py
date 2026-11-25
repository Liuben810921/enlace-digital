#!/usr/bin/env python3
"""Offline, deterministic assertions for proposed order transactions; no DB or HTTP."""
from pathlib import Path

sql_path = Path("sql/propuestas/staging_pedidos_transacciones_concurrencia_no_ejecutar.sql")
plan_path = Path("docs/plan-transacciones-concurrencia-pedidos-no-ejecutar-2026-11-09.md")
sql = sql_path.read_text(encoding="utf-8")
plan = plan_path.read_text(encoding="utf-8")
assert all(not line.strip() or line.lstrip().startswith("--") for line in sql.splitlines()), "Proposal must be entirely comments"
for name in ("ed_pedido_crear_privado", "ed_pedido_transicionar_privado", "ed_pedido_verificar_pago_privado"):
    assert name in sql and name in plan, f"Missing function design: {name}"
for invariant in (
    "UNIQUE(cliente_numero,idempotency_key)", "request_sha256", "FOR UPDATE",
    "NUMERIC", "OWN stock", "SUPPLIER", "VERSION_CONFLICT",
    "IDEMPOTENCY_CONFLICT", "OUT_OF_STOCK", "append-only",
    "SECURITY DEFINER", "rollback", "No external side effects before commit",
):
    assert invariant.lower() in sql.lower(), f"Missing transaction invariant: {invariant}"
for case in range(1, 11):
    label = f"C{case:02d}"
    assert f"{label}:" in sql, f"Missing scenario pseudocode: {label}"
    assert f"| {label} |" in plan, f"Missing scenario matrix: {label}"
for term in ("stock nunca negativo", "sin segundo pedido", "sin deadlock", "Rollback total", "FORBIDDEN", "NO-GO"):
    assert term in plan, f"Missing acceptance or safety condition: {term}"
assert "NO EJECUTADO" in plan
print("PASS: inert transaction design, 3 function contracts, 10 concurrency scenarios, rollback")
