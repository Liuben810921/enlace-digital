#!/usr/bin/env python3
"""F6 protocol-only static validator; does not access Supabase or run SQL."""
from pathlib import Path
p=Path("docs/f6-protocolo-pruebas-controladas-staging-no-ejecutable-2026-11-10.md")
s=p.read_text(encoding="utf-8")
for prefix,n in (("P",12),("T",16)):
    for i in range(1,n+1):
        assert f"{prefix}{i:02d}" in s, f"missing {prefix}{i:02d}"
for token in ("F6-A","F6-B","F6-C","F6-D","NO EJECUTABLE",
              "xqahthghvozeigbojhyi","NORM-v1","ID-STRING-v1",
              "ON CONFLICT","RLS","SECURITY DEFINER","search_path",
              "anon/authenticated","service_role","NOT VALID",
              "UNIQUE","20 solicitudes","9007199254740992",
              "9223372036854775807","NO-GO","git revert",
              "PENDIENTES DE STAGING","no DELETE masivo","sin revelar secretos",
              "sin tocar clientes reales","pedidos reales"):
    assert token.lower() in s.lower(), f"missing {token}"
assert "NO-GO para T03–T12" in s
assert "requiere autorización independiente" in s
assert "no contiene instrucciones SQL listas para ejecutar" in s.lower()
print("PASS F6: 12 preflight gates, 16 pending staging tests, four authorization boundaries, NO-GO and rollback")
print("NOTE: static protocol validation only; no Supabase access, SQL, staging tests or deployment")
