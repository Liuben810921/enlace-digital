#!/usr/bin/env python3
"""Offline validation of the F6-A metadata-only report; no database connection."""
from pathlib import Path
s=Path("docs/f6a-resultados-metadatos-staging-solo-lectura-2026-11-10.md").read_text(encoding="utf-8")
for term in ("xqahthghvozeigbojhyi","ACTIVE_HEALTHY","int4","int8",
             "ON DELETE CASCADE","NOT VALID","UNIQUE","RLS",
             "service_role","anon/authenticated","SECURITY DEFINER",
             "SECURITY INVOKER","search_path","F0","NO-GO","F6-B",
             "sin enlace de ownership","Supabase no sufrió cambios",
             "no PII","no DDL/DML","pendiente de cobertura documental"):
    assert term.lower() in s.lower(), term
assert "No se ha comprobado la existencia o ausencia de duplicados reales" in s
assert "No declarar igualdad del total de funciones" in s
print("PASS F6-A: scope, read-only metadata comparisons, unresolved function inventory and NO-GO")
