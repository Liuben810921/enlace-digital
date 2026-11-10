#!/usr/bin/env python3
"""F6-B15 offline static security boundary checker."""
from pathlib import Path
s=Path("scripts/generate_f6b15_adversarial_sql.py").read_text()
d=Path("docs/f6b15-pruebas-adversariales-encapsulacion-postgresql-aislado-2026-11-10.md").read_text()
w=Path(".github/workflows/f6b13-isolated-postgres-security.yml").read_text()
for t in ("f6b14_synthetic_generated.sql","f6b15_adversarial_generated.sql","ROLLBACK;",
          "SUPPRESSED","f6b14_owner","f6b14_caller","f6b14_unauthorized",
          "insufficient_privilege","pg_has_role","aclexplode","CREATE TABLE",
          "GRANT SELECT","search_path","FOR i IN 1..12"):
    assert t in s,t
for i in range(1,11):
    assert f"B15-{i:02d}" in d
for t in ("NO-GO","Tiempos","Logs","Autorización A","Autorización B","ROLLBACK"):
    assert t in d,t
assert "postgres:17" in w
assert "public.clientes_direcciones_entrega" not in s
assert "xqahthghvozeigbojhyi" not in s
print("PASS F6-B15 adversarial isolation, suppression and separate authorizations")
