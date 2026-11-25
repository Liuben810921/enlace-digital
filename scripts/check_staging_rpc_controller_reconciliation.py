#!/usr/bin/env python3
"""Offline cross-check of controller RPC calls, v4 SQL and metadata report."""
from pathlib import Path
import re
controller=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
sql=Path("sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql").read_text(encoding="utf-8")
report=Path("docs/conciliacion-rpc-controlador-staging-offline-2026-11-10.md").read_text(encoding="utf-8")
metadata=Path("docs/auditoria-funciones-auth-staging-metadatos-2026-11-10.md").read_text(encoding="utf-8")
expected={"ed_cliente_limite_privado","ed_cliente_registrar_residencia_privado",
          "ed_cliente_login_privado","ed_cliente_sesion_privada",
          "ed_cliente_direccion_privada"}
calls=re.findall(r'\bdb\.rpc\(\s*["\x27](ed_[a-z_]+)',controller)
assert len(calls)==8, f"Unexpected RPC call sites: {len(calls)}"
assert set(calls)==expected, f"Unexpected RPC names: {set(calls)^expected}"
defs=set(re.findall(r'CREATE OR REPLACE FUNCTION\s+public\.(ed_cliente_\w+)\s*\(',sql,re.I))
assert defs=={"ed_cliente_registrar_privado","ed_cliente_registrar_residencia_privado",
              "ed_cliente_login_privado","ed_cliente_sesion_privada",
              "ed_cliente_direccion_privada"}
assert "result:=public.ed_cliente_registrar_privado(" in sql
assert "ed_cliente_registrar_privado" not in calls
for name in expected:
    assert name in metadata and name in report
for name in ("ed_emitir_token_correo_privado","ed_consumir_token_correo_privado",
             "ed_correo_emitir_token_servicio","ed_correo_consumir_token_servicio"):
    assert name in metadata and name in report and name not in calls
for name in ("clientes_destinatarios","clientes_direcciones_entrega"):
    assert f'db.from("{name}")' in controller
assert '.eq("cliente_numero",customer.numero)' in controller
for n in range(1,9):
    assert f"| C{n:02d} |" in report
assert "NO-GO" in report and "Reversión" in report
print("PASS: 5 unique RPCs, 8 calls, 5 v4 definitions, legacy wrapper, email and access safeguards")
print("NOTE: offline static-only; no SQL, Supabase or service execution")
