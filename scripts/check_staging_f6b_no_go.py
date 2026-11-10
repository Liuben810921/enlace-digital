#!/usr/bin/env python3
"""F6-B safety stop validation; offline only."""
from pathlib import Path
s=Path("docs/f6b-no-go-normalizacion-agregados-sin-consulta-2026-11-10.md").read_text(encoding="utf-8")
for term in ("NO-GO","NORM-v1","NFC","White_Space","UTF-8","U+200B",
             "U+FEFF","no se ejecutó consulta agregada","no se accedió a filas, direcciones",
             "nueva autorización explícita","no se conocen conteos",
             "git revert","F1","staging","sin consulta"):
    assert term.lower() in s.lower(), term
assert "No sería correcto utilizar" in s
print("PASS F6-B: fail-closed privacy gate, no unvalidated aggregate claims")
