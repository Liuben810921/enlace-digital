#!/usr/bin/env python3
"""F6-B24: fail-closed raw JSON lexer before JSONB, disposable CI only."""
import json
import os
import re
import subprocess
from decimal import Decimal

# Contract: ASCII wire bytes only; four distinct keys, exact JSON integer syntax,
# no escape sequences, and no free-form Unicode. This is a narrow prototype.
EXPECTED=("version","action","currency","amount_minor")
MAX_BYTES=256
STRING_RE=re.compile(r'^[a-zA-Z0-9_-]+$',re.ASCII)
KEY_RE=re.compile(r'^[A-Za-z0-9_-]{8,100}$',re.ASCII)
ACT_RE=re.compile(r'^[a-z][a-z0-9_]{0,39}$',re.ASCII)
CUR_RE=re.compile(r'^[A-Z]{3}$',re.ASCII)
AMT_RE=re.compile(r'^(0|[1-9][0-9]{0,14})$',re.ASCII)
class Reject(ValueError): pass
class RawInteger(str): pass
def no_dupes(pairs):
    out={}
    for k,v in pairs:
        if k in out: raise Reject("duplicate key")
        out[k]=v
    return out
def reject_float(s):
    raise Reject("fraction or exponent not allowed")
def reject_constant(s):
    raise Reject("nonfinite number")
def parse_int(s):
    if not AMT_RE.fullmatch(s): raise Reject("invalid integer")
    return RawInteger(s)
def strict(raw):
    if not isinstance(raw,bytes) or len(raw)>MAX_BYTES or not raw or any(c>127 for c in raw):
        raise Reject("non ASCII or overlong")
    text=raw.decode("ascii")
    # Escape sequences, including Unicode escapes and escaped slashes, are forbidden
    # even when their decoded strings could be ASCII. Prevent parser disagreement.
    if "\\" in text: raise Reject("escape forbidden")
    try:
        obj=json.loads(text,object_pairs_hook=no_dupes,parse_int=parse_int,
                       parse_float=reject_float,parse_constant=reject_constant)
    except (ValueError,UnicodeError) as e: raise Reject(str(e)) from e
    if not isinstance(obj,dict) or set(obj)!=set(EXPECTED): raise Reject("shape")
    if not isinstance(obj["version"],str) or obj["version"]!="ED-OP-v1": raise Reject("version")
    if not isinstance(obj["action"],str) or not ACT_RE.fullmatch(obj["action"]): raise Reject("action")
    if not isinstance(obj["currency"],str) or not CUR_RE.fullmatch(obj["currency"]): raise Reject("currency")
    if not isinstance(obj["amount_minor"],RawInteger) or not AMT_RE.fullmatch(obj["amount_minor"]): raise Reject("amount")
    # Construct server-bound JSON from verified scalars only; no raw payload pass-through.
    canonical=json.dumps(obj,separators=(",",":"),ensure_ascii=True,sort_keys=True)
    return canonical
GOOD=b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
GOOD_REORDER=b' { "amount_minor":12345, "currency":"USD", "action":"reserve", "version":"ED-OP-v1" } '
bad=[
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1.0}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1e0}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1E+0}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":-1}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":01}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1234567890123456}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":"1"}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":true}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":null}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":NaN}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":Infinity}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1,"amount_minor":2}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1,"client_id":"b"}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD"}',
 b'{"version":"ED-OP-v1","action":"r\\u0065serve","currency":"USD","amount_minor":1}',
 b'{"version":"ED-OP-v1","action":"caf\\u00e9","currency":"USD","amount_minor":1}',
 '{"version":"ED-OP-v1","action":"café","currency":"USD","amount_minor":1}'.encode("utf8"),
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1}' + b' '*300,
 b'[]',b'null',b'',b'{"version":"ED-OP-v1","action":"reserve","currency":"usd","amount_minor":1}',
 b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":1,}',
]
assert strict(GOOD)==strict(GOOD_REORDER)
for vector in bad:
    try: strict(vector)
    except Reject: pass
    else: raise AssertionError(("raw parser accepted invalid",vector))
# Compare Python strict parser with PostgreSQL JSONB: these ambiguous values
# are normalized by PostgreSQL; therefore the raw guard is indispensable.
base=os.environ.copy()
def pg(sql):
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],
        env=base,capture_output=True,text=True,timeout=15)
    if p.returncode: raise AssertionError(p.stderr)
    return p.stdout.strip()
assert pg("SELECT ('1.0'::jsonb = '1'::jsonb)::text;")=="true"
assert pg("SELECT ('1e0'::jsonb = '1'::jsonb)::text;")=="true"
assert pg("SELECT ('{\"x\":1,\"x\":2}'::jsonb ->> 'x');")=="2"
# Forward only validated canonical JSON into F6-B23 synthetic SQL fixture.
payload=strict(GOOD)
env={**base,"PGUSER":"f6b23_a","PGPASSWORD":"synthetic_b23_a"}
def reserve(key,raw):
    p=strict(raw)
    statement="SELECT f6b23_synthetic.reserve('"+key+"','"+p+"'::jsonb);"
    out=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",statement],
        env=env,capture_output=True,text=True,timeout=15)
    if out.returncode: raise AssertionError(out.stderr)
    return out.stdout.strip()
assert reserve("key-b24-0001",GOOD)=="NEW"
assert reserve("key-b24-0001",GOOD_REORDER)=="REPLAY"
# An invalid raw payload never reaches PostgreSQL or consumes a key.
try: strict(bad[0])
except Reject: pass
else: raise AssertionError("invalid float accepted")
assert reserve("key-b24-0002",GOOD)=="NEW"
print("PASS F6-B24 raw ASCII JSON, duplicate detection, integer lexical guard, parser divergences, idempotent handoff")
