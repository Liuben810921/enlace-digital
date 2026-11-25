#!/usr/bin/env python3
"""Offline guard of recorded P01-P08 metadata observations; no DB connections."""
from pathlib import Path
p=Path("docs/resultados-preflight-p01-p08-supabase-staging-lectura-2026-11-10.md").read_text(encoding="utf-8")
m=Path("docs/matriz-preflight-migraciones-staging-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
for n in range(1,9):
    assert f"| P{n:02d} " in p and f"| P{n:02d} |" in m, f"Missing P{n:02d}"
for token in ("xqahthghvozeigbojhyi", "ubrvuplslconfxwpfzxj", "integer/int4",
              "bigint/int8", "ON DELETE CASCADE", "NOT VALID", "pg_policies",
              "cero políticas", "service_role", "SECURITY DEFINER", "search_path",
              "ed_cliente_registrar_privado", "ed_cliente_registrar_residencia_privado",
              "NO-GO", "P09–P20", "reversión"):
    assert token.lower() in p.lower(), f"Missing finding: {token}"
assert "No se modificó Supabase" in p
print("PASS: P01-P08 metadata evidence, permissions, function and migration blockers")
print("NOTE: static documentation check only, no Supabase access")
