#!/usr/bin/env python3
"""F6-B9 offline-only metadata audit assertions; no database access."""
from pathlib import Path
s=Path("docs/f6b9-auditoria-metadatos-roles-rls-staging-2026-11-10.md").read_text(encoding="utf-8").lower()
for token in ("#515","17 columnas","cliente_numero int4 not null","provincia text not null",
              "municipio text not null","barrio text not null","direccion text not null",
              "relrowsecurity=true","relforcerowsecurity=false","0 políticas rls",
              "service_role","supabase_read_only_user","pg_read_all_data","bypassrls",
              "anon","authenticated","no se consultó","no se leyeron filas",
              "no-go","least privilege","autorización","git revert"):
    assert token in s,token
assert "read-only pero no least privilege" in s
print("PASS F6-B9: 17-column metadata, RLS, effective SELECT, read-all-data risk, historical NO-GO")
