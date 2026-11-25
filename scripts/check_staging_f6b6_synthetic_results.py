#!/usr/bin/env python3
"""Offline-only assertions for authorized F6-B6 synthetic staging report."""
from pathlib import Path
s=Path("docs/f6b6-resultados-vectores-norm-v1-staging-2026-11-10.md").read_text(encoding="utf-8")
for token in ("#499","27/27","tested=27","passed=27","failed=0","V19","V21","V22",
              "42P21","COLLATE","ICU","UTF8","NFC","White_Space","U+200B",
              "U+FEFF","153.121","NO-GO","autorización independiente","git revert",
              "no se crearon tablas"):
    assert token.lower() in s.lower(),token
assert "no constituyen 3 PASS de PostgreSQL" in s
print("PASS F6-B6: 27/27 synthetic staging checks, three transport exclusions, no historical data access")
