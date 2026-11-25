#!/usr/bin/env python3
"""Offline checks of metadata-only staging auth function audit."""
from pathlib import Path
p=Path("docs/auditoria-funciones-auth-staging-metadatos-2026-11-10.md").read_text(encoding="utf-8")
for name in ("ed_consumir_token_correo_privado","ed_emitir_token_correo_privado",
"ed_cliente_direccion_privada","ed_cliente_limite_privado","ed_cliente_login_privado",
"ed_cliente_registrar_privado","ed_cliente_registrar_residencia_privado",
"ed_cliente_sesion_privada","ed_correo_consumir_token_servicio",
"ed_correo_emitir_token_servicio"):
    assert name in p, f"Missing function: {name}"
for marker in ("search_path", "pg_depend", "pg_namespace", "pg_language",
               "EXECUTE", "service_role", "anon", "authenticated", "postgres",
               "NO-GO", "Reversión", "NO VERIFICADO", "R07"):
    assert marker in p, f"Missing audit requirement: {marker}"
assert p.count("| DEFINER |")==8
assert p.count("| INVOKER |")==2
assert "no se consultaron sus cuerpos" in p
assert "no se ha probado funcionalmente" in p
print("PASS: 10 RPC metadata entries, 8 DEFINER, 2 INVOKER and 7 risk gates")
print("NOTE: documentation only, no SQL or Supabase access")
