#!/usr/bin/env python3
"""Offline audit of G2/G3/G4 evidence protocol. No network, credentials or SQL."""
from pathlib import Path
p=Path("docs/st-pre-02-protocolo-desbloqueo-g2-g3-g4-2026-11-10.md").read_text()
for gate, n in (("G2",5),("G3",5),("G4",6)):
    for i in range(1,n+1):
        assert f"{gate}.{i}" in p, f"missing {gate}.{i}"
for word in ["xqahthghvozeigbojhyi","G2 BLOCKED","G3 BLOCKED","G4 parcial/BLOCKED","NO-GO","ROLLBACK","pg_constraint","SMTP","webhooks","pagos","pedidos","service_role","verify_jwt=false","responsable","reversión","sin valores","autorizaciones separadas"]:
    assert word.lower() in p.lower(), f"missing {word}"
assert "No hay permiso para desplegar, escribir" in p
assert "Ninguna inspección adicional a Supabase" in p
assert "no sustituye una prueba futura de reversión de staging" in p
print("PASS: 16 subpuertas G2/G3/G4, blocked status, evidence, rollback and authorization segregation")

report=Path("docs/st-pre-03-evidencia-g2-g3-g4-solo-lectura-2026-11-10.md").read_text()
for gate,n in (("G2",5),("G3",4),("G4",6)):
    for i in range(1,n+1):
        assert f"| {gate}.{i} " in report, f"missing audited subgate {gate}.{i}"
for phrase in ("G2 sigue BLOCKED","G3 sigue BLOCKED","G4 sigue PARCIAL/BLOCKED","NO-GO","auth.users","CASCADE","RESTRICT","0 Edge","sin valores","No se ejecutaron funciones operativas"):
    assert phrase.lower() in report.lower(), f"missing audit finding: {phrase}"
print("PASS: 15 audited subgates and NO-GO preserved")

states=Path("docs/st-pre-04-estados-g2-g3-g4-solo-lectura-2026-11-10.md").read_text()
for gate,n in (("G2",5),("G3",4),("G4",6)):
    for i in range(1,n+1):
        assert f"| {gate}.{i} " in states, f"missing state-only gate {gate}.{i}"
for required in ("G2 BLOCKED", "G3 BLOCKED", "G4 PARCIAL/BLOCKED", "NO-GO", "no se consultó valor alguno", "pg_cron", "pg_net", "supabase_vault", "sin cambios en Supabase"):
    assert required.lower() in states.lower(), f"missing safe state-only assertion: {required}"
print("PASS: state-only inspection retains 15 gate statuses and NO-GO")
