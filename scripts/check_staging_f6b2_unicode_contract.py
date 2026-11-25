#!/usr/bin/env python3
"""Independent offline Unicode oracle and F6-B2 documentation checks. No SQL/network."""
from pathlib import Path
import unicodedata

doc=Path("docs/f6b2-diseno-equivalencia-unicode-norm-v1-offline-2026-11-10.md").read_text(encoding="utf-8")
for i in range(1,19):
    assert f"U{i:02d}" in doc, f"missing U{i:02d}"
for t in ("NORM-v1","PostgreSQL","JavaScript","NFC","White_Space","U+0085","U+2028","U+2029","U+200B","U+FEFF","UTF-8","surrogate","collation","NO-GO","git revert","privacidad"):
    assert t.lower() in doc.lower(),t

WHITE=set(range(9,14))|{0x20,0x85,0xA0,0x1680,0x2028,0x2029,0x202F,0x205F,0x3000}|set(range(0x2000,0x200B))
def canonical(s):
    if not isinstance(s,str): raise ValueError("type")
    if any(0xD800<=ord(c)<=0xDFFF or ord(c) in (0x200B,0xFEFF) or (ord(c)<0x20 and ord(c) not in WHITE) or (0x7F<=ord(c)<=0x9F and ord(c) not in WHITE) for c in s):
        raise ValueError("control")
    s=unicodedata.normalize("NFC",s)
    out=[];pending=False
    for c in s:
        if ord(c) in WHITE:
            pending=bool(out)
        else:
            if pending:out.append(" ")
            out.append(c);pending=False
    return "".join(out)
assert canonical("A\u0301")==canonical("\u00c1")
assert canonical(" La\u00a0\t Habana\r\n ")=="La Habana"
for cp in (0x85,0x1680,0x2003,0x2028,0x2029,0x202F,0x3000):
    assert canonical("a"+chr(cp)+"b")=="a b"
for a,b in (("Calle","calle"),("Peña","Pena"),("Apto 01","Apto 1"),("C/1","C 1")):
    assert canonical(a)!=canonical(b)
for cp in (0,1,0x7F,0x80,0x200B,0xFEFF,0xD800,0xDFFF):
    try:canonical("a"+chr(cp)+"b");assert False
    except ValueError:pass
assert canonical("")==""
assert canonical("A\u0301").encode("utf-8")==canonical("Á").encode("utf-8")
print("PASS F6-B2: 18 documented fixtures, explicit Unicode White_Space, NFC, controls and UTF-8 oracle")
print("LIMIT: Python oracle only; JavaScript and PostgreSQL cross-runtime equivalence NOT yet proven")
