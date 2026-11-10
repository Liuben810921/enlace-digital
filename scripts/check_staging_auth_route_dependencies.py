#!/usr/bin/env python3
"""Offline staging auth route/dependency documentation guard."""
from pathlib import Path
import re
s=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
rpc=Path("sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql").read_text(encoding="utf-8")
schema=Path("sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql").read_text(encoding="utf-8")
doc=Path("docs/matriz-dependencias-rutas-clientes-staging-offline-2026-11-10.md").read_text(encoding="utf-8")
routes=("register","login","session","logout","profile","address-save","recipient-save","delivery-location-save")
for route in routes:
    assert f'action==="{route}"' in s, f"Missing controller route {route}"
    assert route in doc, f"Missing documented route {route}"
for rpc_name in ("ed_cliente_limite_privado","ed_cliente_registrar_residencia_privado","ed_cliente_login_privado","ed_cliente_sesion_privada","ed_cliente_direccion_privada"):
    assert f'db.rpc("{rpc_name}"' in s and rpc_name in doc
assert "result:=public.ed_cliente_registrar_privado(" in rpc
assert "ed_cliente_registrar_privado" in doc
for table in ("clientes_destinatarios","clientes_direcciones_entrega"):
    assert f'db.from("{table}")' in s and table in schema and table in doc
assert "IF pg_catalog.to_regclass('public.clientes_destinatarios') IS NOT NULL" in schema
assert "IF pg_catalog.to_regclass('public.clientes_direcciones_entrega') IS NOT NULL" in schema
assert '.eq("cliente_numero",customer.numero)' in s
assert "Number.isSafeInteger" in s
assert 'ED_STAGING_CUSTOMER_AUTH_ENABLED' in s
for n in range(1,14):
    assert f"F{n:02d}" in doc, f"Missing future functional scenario F{n:02d}"
for n in range(1,13):
    assert f"| A{n:02d} |" in doc, f"Missing acceptance gate A{n:02d}"
for n in range(1,13):
    assert f"R{n:02d}" in doc, f"Missing risk R{n:02d}"
assert "NO-GO" in doc and "Reversión" in doc
print("PASS: 8 routes, 5 RPCs, 2 tables, 13 future scenarios, 12 acceptance gates and 12 risks")
print("NOTE: offline checks only; no SQL, Supabase or operational changes")
