#!/usr/bin/env python3
"""F6-B10 offline-only least-privilege design assertions. No SQL or network."""
from pathlib import Path
s=Path("docs/f6b10-diseno-acceso-minimo-auditoria-historica-offline-2026-11-10.md").read_text(encoding="utf-8").lower()
for i in range(1,11):
    assert f"g10-{i:02d}" in s,f"missing G10-{i:02d}"
for t in ("#519","no sql ejecutado","no acceso a supabase","rol dedicado","rls",
          "ejecución administrativa","bypassrls","pg_read_all_data","select",
          "por columna","cliente_numero","provincia","municipio","barrio",
          "direccion","nfc","white_space","utf-8","suppressed","null",
          "statement_timeout","lock_timeout","read only","gratuito",
          "costos","no-go","autorización independiente","autorización separada",
          "git revert","revoke","drop","security definer"):
    assert t in s,t
assert "sin conteos, booleanos, hashes, grupos" in s
print("PASS F6-B10: alternatives, ten gates, least privilege, privacy NO-GO and rollback")
