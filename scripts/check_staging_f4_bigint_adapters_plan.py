#!/usr/bin/env python3
"""Offline F4 contract checks, no SQL, network or operational code changes."""
from pathlib import Path
import re
d=Path("docs/f4-adaptadores-id-string-v1-edge-rpc-frontend-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
edge=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text(encoding="utf-8")
web=Path("scripts/staging_customer_web_adapter.mjs").read_text(encoding="utf-8")
f3=Path("docs/f3-rpc-direcciones-atomica-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8")
for i in range(1,21):
    assert f"B{i:02d}" in d, f"Missing B{i:02d}"
for token in ("ID-STRING-v1","id::text","9223372036854775807","2147483647",
              "9007199254740992","Number.isSafeInteger","BigInt",
              "cliente_numero","recipient-save","delivery-location-save","profile",
              "JSON.stringify","NO-GO","git revert","fail-closed","RLS",
              "NORM-v1","RPC atómica","frontend"):
    assert token.lower() in d.lower(), token
assert "const validId=" in edge and "Number.isSafeInteger" in edge
assert 'action==="recipient-save"' in edge and 'action==="delivery-location-save"' in edge
assert "response.json()" in web and "JSON.stringify({action,...data})" in web
assert "ID-STRING-v1" in f3

MAX=(1<<63)-1
def canonical(v):
    return isinstance(v,str) and re.fullmatch(r"[1-9][0-9]*",v) is not None and len(v)<=19 and int(v)<=MAX
for x in ("1","9007199254740991","9007199254740992","9223372036854775807"):
    assert canonical(x)
for x in ("9223372036854775808","01","1e3","-1","0"," 1","1.0","",None,True,1,[]):
    assert not canonical(x)
def legacy(v):
    return type(v) is int and 0<v<=9007199254740991
assert legacy(1) and legacy(9007199254740991)
assert not legacy(9007199254740992) and not legacy(True)
print("PASS: F4 20 criteria, bigint boundary and legacy input examples, existing consumer inventory")
print("NOTE: no real RPC/PostgREST/Edge/frontend behavior tested")
