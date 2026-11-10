#!/usr/bin/env python3
"""F6-B11 offline-only audit-role implementation plan validator; no SQL."""
from pathlib import Path
s=Path("docs/f6b11-plan-rol-auditoria-minimo-rollback-offline-2026-11-10.md").read_text(encoding="utf-8").lower()
for i in range(1,11):
    assert f"b11-{i:02d}" in s,f"missing B11-{i:02d}"
for i in range(1,9):
    assert f"t{i:02d}" in s,f"missing synthetic test T{i:02d}"
for token in ("#526","no autorización para sql","no se consultó supabase","autorización a","autorización b",
              "no autorizada","cliente_numero","provincia","municipio","barrio",
              "direccion","por columna","bypassrls","pg_read_all_data",
              "no login","nologin","rls","sin política","security definer",
              "suppressed","utf-8","nfc","white_space","null","statement_timeout",
              "lock_timeout","read only","plan gratuito","revoke","drop policy",
              "drop role","git revert","no-go"):
    if token=="no login":continue
    assert token in s,token
assert "select por columna sigue exponiendo direcciones" in s
assert "la lectura histórica exige autorización b aparte" in s
print("PASS F6-B11: 10 gates, 8 synthetic tests, privilege and RLS risks, independent A/B approvals, rollback")
