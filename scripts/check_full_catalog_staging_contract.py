#!/usr/bin/env python3
"""Offline contract verification. Does not execute SQL, browser or network."""
from pathlib import Path
import re
html=Path("staging-preview/index.html").read_text(encoding="utf-8")
sql=Path("sql/propuestas/staging_catalogo_contrato_completo_no_ejecutar.sql").read_text(encoding="utf-8")
doc=Path("docs/auditoria-contrato-completo-catalogo-staging-2026-11-10.md").read_text(encoding="utf-8")
assert all(not line.strip() or line.lstrip().startswith("--") for line in sql.splitlines()), "Executable SQL detected"
from_row=re.search(r"function edFromRow\(p\)\{(.*?)\}\s*function edToRow",html,re.S)
to_row=re.search(r"function edToRow\(p\)\{(.*?)\}\s*async function edLoadInventory",html,re.S)
assert from_row and to_row, "Serialization functions absent"
required=("id","nombre","marca","modelo","descripcion","categoria","precio_usd","cantidad",
          "disponible","imagenes","especificaciones","origen_producto","archivado","variantes_color","updated_at")
for key in required:
    assert re.search(r"\b"+key+r"\s*:",to_row.group(1)), f"edToRow missing {key}"
    assert key in sql, f"Schema missing {key}"
for key in ("nombre","categoria","precio_usd","cantidad","origen_producto","disponible",
            "descripcion","especificaciones","imagenes","archivado","variantes_color"):
    assert "p."+key in from_row.group(1), f"edFromRow missing {key}"
for token in ("Math.max(...state.products.map(x=>x.id),0)+1",
              "productos_proveedores_privados","__freeShipping","__condition",
              "edUploadPhoto","edInventoryQueue","canOrder(p,n,color)",
              "ED_REAL_CHECKOUT_ENABLED=false"):
    assert token in html, f"Missing frontend evidence: {token}"
for token in ("variant_id uuid","ON DELETE RESTRICT","ROW LEVEL SECURITY","NO-GO"):
    assert token in sql
for i in range(1,17):
    assert f"| C{i:02d} |" in doc, f"Missing scenario C{i:02d}"
print("PASS: 15 serialized keys, legacy reader, catalog risks and 16 acceptance scenarios")
print("NOTE: static only; no SQL execution, DB tests or functional checkout")
