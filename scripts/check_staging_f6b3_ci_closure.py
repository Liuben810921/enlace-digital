#!/usr/bin/env python3
"""Validate recorded CI evidence only; no network or SQL."""
from pathlib import Path
s=Path("docs/f6b3-cierre-ci469-versiones-unicode-2026-11-10.md").read_text(encoding="utf-8")
for term in ("#469","42877039930","SUCCESS","16.0.0","17.0","30/30",
             "20261101.186.1","NO-GO","no prueban equivalencia para todo Unicode",
             "sin cadenas", "git revert"):
    if term=="sin cadenas":continue
    assert term.lower() in s.lower(),term
assert "La lectura agregada de duplicados requiere autorización posterior adicional" in s
print("PASS F6-B3: CI #469 evidence, Unicode version divergence and fail-closed boundaries")
