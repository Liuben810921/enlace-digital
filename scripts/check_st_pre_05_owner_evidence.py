#!/usr/bin/env python3
"""Offline consistency checks; no Supabase/network/credentials."""
from pathlib import Path
s=Path("docs/st-pre-05-guia-owner-evidencias-redactadas-g2-g3-g4-2026-11-10.md").read_text()
for gate in ("G2-COR","G2-PAY","G2-ORD","G2-WEB","G3-BAK","G3-REV","G4-AUTH","G4-FLAG"):
    assert s.count(gate)>=2, f"missing control/acta {gate}"
for phrase in ("42923003774","SUCCESS","G2 BLOCKED","G3 BLOCKED","G4 PARCIAL/BLOCKED","NO-GO","autorización independiente","sin valores","sin cambios en Supabase","NO autoriza","BLOCKED","reversión","service_role","SMTP","PITR"):
    assert phrase.casefold() in s.casefold(), f"missing {phrase}"
assert "no hacer captura ni copiar texto" in s
assert "no se leerán ni copiarán" in s
print("PASS: eight owner evidence controls, redaction, no-go, rollback and authorization segregation")
