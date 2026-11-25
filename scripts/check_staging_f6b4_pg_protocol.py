#!/usr/bin/env python3
"""Static verification of PostgreSQL-only future protocol. No database or network."""
from pathlib import Path
s=Path("docs/f6b4-protocolo-postgresql-30-vectores-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
for i in range(1,13):
    assert f"PG{i:02d}" in s, f"missing PG{i:02d}"
for token in ("NO EJECUTABLE","no ejecutar SQL","no consultar Supabase",
              "30 vectores","25 puntos","UTF8","ICU","libc","NFC",
              "Unicode 16.0.0","17.0","UTF-8","surrogates",
              "U+200B","U+FEFF","C0/C1","NO-GO","git revert",
              "Autorización A","Autorización B","Autorización C",
              "sin datos reales","sin conexión a staging"):
    assert token.lower() in s.lower(), token
print("PASS F6-B4: 12 PostgreSQL synthetic-only gates, Unicode/collation requirements, separate approvals")
print("NOTE: no SQL executed and no PostgreSQL/Supabase connection")
