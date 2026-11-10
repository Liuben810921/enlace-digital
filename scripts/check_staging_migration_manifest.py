#!/usr/bin/env python3
"""Offline guard for the proposed staging migration manifest. Never connects to a database."""
from pathlib import Path
p=Path("docs/especificacion-unica-migraciones-staging-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
master=Path("docs/plan-maestro-catalogo-pedidos-inventario-reservas-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
shop=Path("staging-preview/index.html").read_text(encoding="utf-8")
for n in range(10):
    assert f"| G{n:02d} |" in p, f"Missing manifest stage G{n:02d}"
for n in range(1,19):
    assert f"| T{n:02d} |" in p, f"Missing acceptance test T{n:02d}"
for token in ("clientes_oficiales.numero integer", "pedidos_oficiales.cliente_numero integer",
              "productos.id bigint", "pedidos_oficiales.id bigint", "variant_id uuid",
              "stock_reservado <= stock_fisico", "UNIQUE(cliente_numero,idempotency_key)",
              "request_sha256", "SECURITY DEFINER", "search_path", "service_role",
              "append-only", "NO-GO", "ED_REAL_CHECKOUT_ENABLED=false",
              "Reversión", "no SQL ejecutado", "idempotencia"):
    assert token.lower() in p.lower(), f"Missing safety contract: {token}"
for token in ("15 campos", "variant_id", "F0", "F6"):
    assert token in master, f"Master plan dependency absent: {token}"
assert "ED_REAL_CHECKOUT_ENABLED=false" in shop
assert "nombres de artefactos futuros, no archivos SQL ejecutables" in p
print("PASS: 10 future stages, 18 acceptance gates, types, security, rollback and disabled checkout")
print("NOTE: static-only documentation test; no SQL, migration, Supabase or deployment")
