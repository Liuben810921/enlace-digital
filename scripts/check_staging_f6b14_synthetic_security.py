#!/usr/bin/env python3
"""F6-B14 offline static boundaries; no SQL execution, no network."""
from pathlib import Path
import json
generator=Path("scripts/generate_f6b14_synthetic_sql.py").read_text()
doc=Path("docs/f6b14-norm-v1-vectores-seguridad-postgresql-aislado-2026-11-10.md").read_text()
wf=Path(".github/workflows/f6b13-isolated-postgres-security.yml").read_text()
cases=json.loads(Path("tests/fixtures/norm_v1_utf8_vectors.json").read_text())["cases"]
assert len(cases)==30
assert [c["id"] for c in cases if any(0xD800<=ord(ch)<=0xDFFF for ch in c["input"])]==["V21","V22"]
for t in ("SECURITY DEFINER","NOBYPASSRLS","SET ROLE f6b14_caller",
          "SET ROLE f6b14_unauthorized","has_column_privilege",
          "has_function_privilege","SQLSTATE '22023'","insufficient_privilege",
          "ROLLBACK;","SUPPRESSED","normalize(s,NFC)","convert_to(",
          "WHEN OTHERS","CREATE POLICY","SET search_path = pg_catalog, pg_temp"):
    assert t in generator,t
for t in ("28","V21","V22","NO-GO","Autorización A","autorización B","ROLLBACK"):
    assert t in doc,t
for i in range(1,11):
    assert f"B14-{i:02d}" in doc
assert "python3 scripts/generate_f6b14_synthetic_sql.py" in wf
assert "/tmp/f6b14_synthetic_generated.sql" in wf
assert "postgres:17" in wf and "synthetic_ci_only" in wf
assert "public.clientes_direcciones_entrega" not in generator
assert "xqahthghvozeigbojhyi" not in generator
print("PASS F6-B14: 30 synthetic fixtures, 28 SQL / 2 UTF-8 boundary, negative privilege gates")
