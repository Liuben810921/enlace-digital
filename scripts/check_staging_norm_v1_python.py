#!/usr/bin/env python3
"""Independent Python oracle for shared synthetic UTF-8 vectors. No SQL or network."""
import json,unicodedata
from pathlib import Path
v=json.loads(Path("tests/fixtures/norm_v1_utf8_vectors.json").read_text(encoding="utf-8"))
ws={int(s,16) for s in v["unicode_whitespace_hex"]}
def normalize(s):
    if not isinstance(s,str):raise ValueError("type")
    for c in s:
        n=ord(c)
        if 0xD800<=n<=0xDFFF or n in (0x200B,0xFEFF) or (n<32 and n not in ws) or (0x7F<=n<=0x9F and n not in ws):raise ValueError("control")
    s=unicodedata.normalize("NFC",s)
    out=[];pending=False
    for c in s:
        if ord(c) in ws:pending=bool(out)
        else:
            if pending:out.append(" ")
            out.append(c);pending=False
    return "".join(out)
for case in v["cases"]:
    if case.get("reject"):
        try:normalize(case["input"])
        except ValueError:continue
        raise AssertionError(case["id"]+" should reject")
    assert normalize(case["input"]).encode("utf-8").hex()==case["output_hex"],case["id"]
assert len(v["cases"])==30
assert len(ws)==25
print("PASS: Python NORM-v1 30 UTF-8 fixtures, Unicode",unicodedata.unidata_version)
print("NOTE: Python and JS fixture parity does not establish PostgreSQL equivalence")
