#!/usr/bin/env python3
"""F6-B12 offline design validation; no SQL, no Supabase."""
from pathlib import Path
s=Path("docs/f6b12-diseno-seguridad-agregado-encapsulado-offline-2026-11-10.md").read_text(encoding="utf-8").lower()
for i in range(1,11):
    assert f"b12-{i:02d}" in s,f"missing B12-{i:02d}"
    assert f"s12-{i:02d}" in s,f"missing S12-{i:02d}"
for t in ("#534","no sql","no supabase","security definer","security invoker",
          "search_path","pg_catalog","pg_temp","owner","execute","public",
          "anon","authenticated","service_role","rls","bypassrls",
          "security definer","suppressed","count(*)","null","unicode",
          "nfc","white_space","utf-8","statement_timeout","lock_timeout",
          "tiempo","errores","logging","plan gratuito","git revert",
          "autorización a","autorización b","no autorizada","no-go"):
    assert t in s,t
assert "no instalar una función que devuelva siempre" in s
print("PASS F6-B12: encapsulated alternatives, 10 gates, 10 synthetic tests, independent A/B approvals")
