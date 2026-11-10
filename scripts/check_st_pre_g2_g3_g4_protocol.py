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
