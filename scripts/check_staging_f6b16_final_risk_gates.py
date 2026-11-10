#!/usr/bin/env python3
"""F6-B16: static offline risk gate validation; no SQL and no network."""
from pathlib import Path

path=Path("docs/f6b16-evaluacion-final-riesgos-go-no-go-offline-2026-11-10.md")
s=path.read_text(encoding="utf-8")
for i in range(1,13):
    assert f"R16-{i:02d}" in s, f"missing residual risk R16-{i:02d}"
for i in range(1,10):
    assert f"A16-{i:02d}" in s, f"missing implementation gate A16-{i:02d}"
for i in range(1,6):
    assert f"B16-{i:02d}" in s, f"missing historical gate B16-{i:02d}"
for i in range(1,11):
    assert f"B16-{i:02d}" in s, f"missing final gate B16-{i:02d}"
for t in (
    "#27", "#572", "42904108683", "42904108680",
    "NO-GO para implementar", "NO-GO independiente",
    "SUPPRESSED", "SECURITY DEFINER", "search_path",
    "RLS", "EXECUTE", "BYPASSRLS", "PUBLIC", "pg_read_all_data",
    "Tiempos", "Logs", "Errores", "Repetición", "Supresión",
    "umbral k", "READ ONLY", "Costos", "plan gratuito",
    "ROLLBACK", "git revert", "Autorización A", "autorización B",
    "NO AUTORIZADAS", "28 transportables", "2 sustitutos",
):
    assert t in s, f"missing risk control: {t}"
assert "no se ejecuta sql" in s.lower()
assert "no se consulta supabase" in s.lower()
assert "dos decisiones independientes" in s.lower()
assert s.count("NO-GO")>=15
print("PASS F6-B16: 12 residual risks, 9 A gates, 5 B gates, 10 final GO/NO-GO gates")
