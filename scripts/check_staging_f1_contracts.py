#!/usr/bin/env python3
"""F1 contract examples; Python reference is illustrative, not an SQL/JS implementation."""
from pathlib import Path
import re
import unicodedata

DOC=Path("docs/f1-contratos-norm-v1-id-string-v1-offline-2026-11-10.md").read_text(encoding="utf-8")
EDGE=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
F0=Path("docs/resultados-f0-metadatos-staging-lectura-2026-11-10.md").read_text(encoding="utf-8")
for prefix,n in (("N",12),("I",14)):
    for i in range(1,n+1):
        assert f"{prefix}{i:02d}" in DOC, f"Missing {prefix}{i:02d}"
for token in ("NORM-v1","ID-STRING-v1","NFC","White_Space","U+200B","U+FEFF",
              "ON CONFLICT","UNIQUE","service_role","search_path","2147483647",
              "9007199254740991","9007199254740992","9223372036854775807",
              "Number.isSafeInteger","PostgREST","cliente_numero","git revert"):
    assert token in DOC, token
assert "int8" in F0 and "int4" in F0
assert "const validId=" in EDGE and "Number.isSafeInteger" in EDGE
assert 'action==="delivery-location-save"' in EDGE and 'action==="recipient-save"' in EDGE
assert '.maybeSingle()' in EDGE and 'db.from("clientes_direcciones_entrega")' in EDGE

def norm(s):
    s=unicodedata.normalize("NFC",s)
    if any(ord(c)<32 and not c.isspace() or 127<=ord(c)<=159 or c in "\u200b\ufeff" for c in s):
        raise ValueError("invisible control")
    return " ".join(s.split())

assert norm("  La   Habana\u00a0")=="La Habana"
assert norm("\u00c1")==norm("A\u0301")
for a,b in [("Calle 12 #5","calle 12 #5"),("Peña","Pena"),("Apto 01","Apto 1"),("C/1","C 1")]:
    assert norm(a)!=norm(b)
assert norm("   ")==""
for value in ["A\u200bB","A\ufeffB"]:
    try: norm(value); raise AssertionError("Must reject invisible codepoint")
    except ValueError: pass

MAX=(1<<63)-1
def valid_string_id(v):
    return isinstance(v,str) and re.fullmatch(r"[1-9][0-9]*",v) is not None and len(v)<=19 and int(v)<=MAX
for value in ("1","9007199254740991","9007199254740992","9223372036854775807"):
    assert valid_string_id(value)
for value in ("9223372036854775808","01","1e3","-1","0"," 1",1,None):
    assert not valid_string_id(value)
assert isinstance(2147483647,int)
print("PASS: F1 26 contract scenarios, F0 types and existing controller incompatibilities")
print("NOTE: offline reference only; no Supabase, SQL, frontend changes or deployment")
