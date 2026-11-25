#!/usr/bin/env python3
"""Static-only guard for v4, concurrency and bigint remediation decisions."""
from pathlib import Path
p=Path("docs/plan-remediacion-v4-concurrencia-bigint-staging-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
v4=Path("sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql").read_text(encoding="utf-8")
edge=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
shop=Path("staging-preview/index.html").read_text(encoding="utf-8")
for n in range(1,5): assert f"M{n:02d}" in p
for n in range(1,6): assert f"D{n:02d}" in p
for n in range(1,5): assert f"I{n:02d}" in p
for n in range(6): assert f"| R{n} |" in p
for token in ("NO-GO", "Reversión", "ON CONFLICT", "Number.MAX_SAFE_INTEGER",
              "9223372036854775807", "cliente_numero", "UNIQUE", "20 solicitudes",
              "incremental", "service_role", "no consultas a Supabase"):
    assert token.lower() in p.lower(), f"Missing safeguard: {token}"
assert "to_regclass('public.clientes_destinatarios')" in v4
assert "to_regclass('public.clientes_direcciones_entrega')" in v4
assert 'db.from("clientes_direcciones_entrega")' in edge
assert "Number.isSafeInteger" in edge
assert "ED_REAL_CHECKOUT_ENABLED=false" in shop
print("PASS: 3 remediation decisions, 13 acceptance checks, 6 phases, and rollback gates")
print("NOTE: offline static test only; no SQL or Supabase")
