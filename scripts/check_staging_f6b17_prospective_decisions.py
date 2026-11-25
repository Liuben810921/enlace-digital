#!/usr/bin/env python3
"""F6-B17: offline decision matrix guards, no SQL or network."""
from pathlib import Path
s=Path("docs/f6b17-matriz-alternativas-deduplicacion-prospectiva-norm-v1-offline-2026-11-10.md").read_text(encoding="utf-8")
for i in range(1,8):
    assert f"D17-{i:02d}" in s, f"missing alternative {i}"
for i in range(1,11):
    assert f"G17-{i:02d}" in s, f"missing gate {i}"
for t in ("#578","#31","42904679442","42904679362",
          "NORM-v1","UTF-8 bytea","25 puntos","U+200B","U+FEFF",
          "28 transportables","2 sustitutos","validación prospectiva",
          "Normalización","UNIQUE global","migración","concurrencia",
          "nuevo frente a histórico","filas históricas","RLS",
          "rollback","costos gratuitos","Autorización A",
          "autorización B","SUPPRESSED","NO-GO staging",
          "NO-GO lectura histórica","git revert"):
    assert t.lower() in s.lower(), f"missing control: {t}"
assert "sin sql ejecutado" in s.lower()
assert "sin consultas a supabase" in s.lower()
assert "no puede asegurar" in s.lower()
assert s.count("NO-GO")>=15
print("PASS F6-B17: 7 alternatives, 10 gates, prospective limitation and separate authorizations")
