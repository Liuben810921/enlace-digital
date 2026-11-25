#!/usr/bin/env python3
"""Offline documentary checks for F3 RPC design; no database or SQL execution."""
from pathlib import Path
d=Path("docs/f3-rpc-direcciones-atomica-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
f1=Path("docs/f1-contratos-norm-v1-id-string-v1-offline-2026-11-10.md").read_text(encoding="utf-8")
f2=Path("docs/f2-migracion-incremental-staging-norm-bigint-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
edge=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
for i in range(1,21):
    assert f"T{i:02d}" in d, f"Missing F3 T{i:02d}"
for word in ("NORM-v1","ID-STRING-v1","UNIQUE","ON CONFLICT","service_role",
             "SECURITY DEFINER","search_path","PUBLIC, anon, authenticated",
             "cliente_numero","reused","NO-GO","git revert","snapshot",
             "20 solicitudes","9223372036854775807","9007199254740991",
             "sin SQL ejecutable","no sobrescribir receptor","fail-closed"):
    assert word.lower() in d.lower(), word
assert "NORM-v1" in f1 and "ID-STRING-v1" in f1
assert "UNIQUE" in f2 and "ON CONFLICT" in f2
assert 'action==="delivery-location-save"' in edge
assert '.select("id").eq("cliente_numero",customer.numero)' in edge
assert '.maybeSingle()' in edge
assert "no hay cambios en Supabase" in d
print("PASS: F3 20 scenarios, auth, ownership, atomic uniqueness, bigint, rollback")
print("NOTE: static design assertions only, no functional concurrency test")
