#!/usr/bin/env python3
"""Offline-only check of staging PostgreSQL metadata preflight report."""
from pathlib import Path
s=Path("docs/f6b5-preflight-postgresql-staging-metadatos-2026-11-10.md").read_text(encoding="utf-8")
for t in ("#495","17.11","UTF8","ICU","153.121","datlocprovider=i","libc","2.41","normalize(text, text)","convert_to(text,name)","pg_catalog.pg_proc","NO-GO","30 vectores","autorización posterior","git revert","sin filas de clientes"):
    assert t.lower() in s.lower(),t
assert "No se ejecutaron los 30 vectores sintéticos en staging" in s
print("PASS F6-B5: authorized metadata-only PostgreSQL preflight, ICU/libc contrast and separate approval gates")
