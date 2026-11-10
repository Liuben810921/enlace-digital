#!/usr/bin/env python3
"""Offline documentary contract guard: no database, SQL execution or network."""
from pathlib import Path
p=Path("docs/especificacion-incremental-direcciones-bigint-staging-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
v4=Path("sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql").read_text(encoding="utf-8")
edge=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
shop=Path("staging-preview/index.html").read_text(encoding="utf-8")
for prefix, n in (("INC-P",6),("INC-A",5),("DEDUP-P",5),("DEDUP-A",6),("BIGINT-P",4),("BIGINT-A",6)):
    for i in range(1,n+1):
        assert f"{prefix}{i:02d}" in p, f"Missing {prefix}{i:02d}"
for i in range(7): assert f"| S{i:02d} |" in p
for word in ("NOT VALID","ON CONFLICT","UPSERT","UNIQUE","SECURITY DEFINER",
             "search_path","service_role","Number.isSafeInteger",
             "9223372036854775807","9007199254740992","NO-GO","Reversión"):
    assert word.lower() in p.lower(), f"Missing safeguard: {word}"
assert "to_regclass('public.clientes_destinatarios')" in v4
assert "Number.isSafeInteger" in edge
assert "ED_REAL_CHECKOUT_ENABLED=false" in shop
print("PASS: 3 specifications, 15 preconditions, 17 acceptance gates, 7 ordered stages")
print("NOTE: static-only, no SQL, Supabase or deployment")
