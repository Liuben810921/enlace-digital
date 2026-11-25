#!/usr/bin/env python3
"""F2 offline proposal validation; does not connect to database or run SQL."""
from pathlib import Path
d=Path("docs/f2-migracion-incremental-staging-norm-bigint-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
f0=Path("docs/resultados-f0-metadatos-staging-lectura-2026-11-10.md").read_text(encoding="utf-8")
f1=Path("docs/f1-contratos-norm-v1-id-string-v1-offline-2026-11-10.md").read_text(encoding="utf-8")
for prefix,n in (("P",12),("A",16)):
    for i in range(1,n+1):
        assert f"{prefix}{i:02d}" in d, f"Missing {prefix}{i:02d}"
for i in range(8):
    assert f"M{i}" in d, f"Missing M{i}"
for marker in ("NO EJECUTABLE","NO-GO","git revert","ON CONFLICT","UNIQUE","NFC",
               "White_Space","NOT VALID","service_role","anon","authenticated",
               "search_path","SECURITY DEFINER","cliente_numero","id::text",
               "clientes_oficiales","clientes_destinatarios","clientes_direcciones_entrega",
               "2^53","20 solicitudes","snapshot","RLS","sin extraer PII",
               "sin borrar","sin alterar rutas activas"):
    assert marker.lower() in d.lower(), marker
for marker in ("int4","int8","NOT VALID","RLS"):
    assert marker in f0 and marker in d
for marker in ("NORM-v1","ID-STRING-v1"):
    assert marker in f1 and marker in d
assert "NO-GO si hay duplicados sin resolver" in d
assert "no se consultaron filas ni metadatos nuevos en F2" in d
print("PASS: F2 12 preflight controls, 8 stages, 16 acceptance criteria, security and rollback")
print("NOTE: offline text checks only; not a functional database migration test")
