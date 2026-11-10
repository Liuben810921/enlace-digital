#!/usr/bin/env python3
"""Static verification of historical isolated PostgreSQL evidence; no SQL/network."""
from pathlib import Path
s=Path("docs/f6b4-resultados-postgresql-aislado-ci488-2026-11-10.md").read_text(encoding="utf-8")
for term in ("#488","42878154919","SUCCESS","17.11","UTF8",
             "en_US.utf8","libc","2.41","28/28","2/2",
             "Unicode 16.0.0","Unicode 17.0","NO-GO",
             "pg_temp.norm_v1","--network none","no se enviaron",
             "no se verificó","git revert"):
    assert term.lower() in s.lower(),term
print("PASS F6-B4: isolated PostgreSQL synthetic test evidence and strict staging NO-GO")
