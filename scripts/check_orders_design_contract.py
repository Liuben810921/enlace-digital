#!/usr/bin/env python3
"""Offline design-contract checks. Never connects to Supabase."""
from pathlib import Path

sql = Path("sql/propuestas/staging_pedidos_oficiales_snapshot_no_ejecutar.sql").read_text()
html = Path("staging-preview/index.html").read_text()
doc = Path("docs/contratos-corregidos-pedidos-preimplementacion-2026-11-09.md").read_text()

assert all(not line.strip() or line.lstrip().startswith("--") for line in sql.splitlines()), "SQL proposal must remain inert"
for table in ("pedidos_oficiales", "pedidos_oficiales_items", "pedidos_oficiales_estados"):
    assert f"CREATE TABLE public.{table}" in sql
for column in ("id bigint", "cliente_numero integer", "destinatario_nombre text", "entrega_direccion text", "total_usd numeric", "estado text", "creado_en timestamptz"):
    assert column in sql, f"Admin contract missing {column}"
for field in ("entrega_calle_detalle", "entrega_provincia", "entrega_municipio", "entrega_barrio", "destinatario_telefono", "idempotency_key uuid", "producto_id_origen bigint", "precio_unitario_usd numeric", "origen_producto text", "pago_estado text", "mensajeria_cup numeric", "mensajeria_gratis boolean"):
    assert field in sql, f"Snapshot contract missing {field}"
for marker in ("origen_producto IN ('propio','proveedor')", "Server re-reads price", "SUPPLIER:", "OWN:", "append-only", "supervisor read-only"):
    assert marker in sql, f"Business contract missing {marker}"
assert "const ED_REAL_CHECKOUT_ENABLED=false;" in html
assert "function edConfirmSimulatedCheckout()" in html
assert "/rest/v1/productos?select=*" in html
assert "p.origen_producto==='proveedor'?null:p.cantidad" in html
assert "/rest/v1/pedidos_oficiales?select=id,cliente_numero,destinatario_nombre,entrega_direccion,total_usd,estado,creado_en" in html
assert "enlace-cliente-auth-staging" in Path("supabase/functions/enlace-cliente-auth-staging/index.ts").as_posix()
assert "/functions/v1/enlace-cliente-auth'" in html, "Known endpoint mismatch changed; reassess contracts"
assert "NO-GO" in doc
print("PASS: inert SQL, historical snapshots, catalog/stock contracts, simulated checkout")
print("KNOWN BLOCKER: HTML Edge URL differs from audited staging function; no integration certified")
