#!/usr/bin/env python3
"""F6-B7 fail-closed privacy protocol checks; offline, no SQL or network."""
from pathlib import Path
s=Path("docs/f6b7-protocolo-privacidad-agregados-historicos-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
for i in range(1,11):
    assert f"B7-{i:02d}" in s,f"missing B7-{i:02d}"
for t in ("NORM-v1","cliente_numero","provincia","municipio","barrio","direccion",
          "NFC","White_Space","UTF-8","25 puntos","ICU","SUPPRESSED",
          "NO-GO","NO AUTORIZADA","NO DEMOSTRADA","NO DEFINIDO","NULL",
          "una sola ejecución","statement_timeout","lock_timeout",
          "sin exportación de filas","sin DDL/DML","git revert",
          "próxima autorización, independiente","no se conoce","no se ejecutó SQL"):
    assert t.lower() in s.lower(),t
assert "no se deben devolver `count(*)`" in s.lower(), "counts must be suppressed"
assert "No se deben devolver" in s
print("PASS F6-B7: 10 gates, versioned identity, fail-closed privacy, separate historical authorization")
