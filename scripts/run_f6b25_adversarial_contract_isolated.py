#!/usr/bin/env python3
"""F6-B25 adversarial transport contract, isolated PostgreSQL CI only."""
import runpy
import json
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256

# Executes the already CI-validated F6-B24 fixture, then reuses its strict parser.
source=open("scripts/run_f6b24_raw_json_contract_isolated.py",encoding="utf-8").read().split("GOOD=b",1)[0]
scope={}
exec(compile(source,"f6b24_parser_only","exec"),scope)
strict=scope["strict"]
Reject=scope["Reject"]
GOOD=scope["GOOD"]
REORDER=scope["GOOD_REORDER"]

def rejects(raw):
    try: strict(raw)
    except Reject: return
    raise AssertionError(("unexpected acceptance",raw[:100]))
def accepts(raw):
    return strict(raw)

# Boundaries: exact maximum byte length, one byte beyond, valid max minor units,
# and max-length ASCII action. Whitespace is legal and counts towards wire limit.
assert len(GOOD)<256
padded=GOOD+b" "*(256-len(GOOD))
assert len(padded)==256
assert accepts(padded)==accepts(GOOD)
rejects(padded+b" ")
maxamount=GOOD.replace(b"12345",b"999999999999999")
assert '"amount_minor":999999999999999' in accepts(maxamount)
rejects(GOOD.replace(b"12345",b"1000000000000000"))
maxaction=b"a"+b"x"*39
maxact=GOOD.replace(b"reserve",maxaction)
assert '"action":"' + maxaction.decode() + '"' in accepts(maxact)
rejects(GOOD.replace(b"reserve",maxaction+b"x"))
# Adversarial key representations and Unicode: no implicit normalization.
for raw in [
    GOOD.replace(b"reserve",b"res\\u0065rve"),
    GOOD.replace(b"reserve",b"res\\/erve"),
    GOOD.replace(b"reserve",b"res\\nserve"),
    GOOD.replace(b"reserve",b"res\\tserve"),
    GOOD.replace(b"reserve",b"res\\uD800erve"),
    GOOD.replace(b"reserve",b"res\\u0000erve"),
    GOOD.replace(b"reserve",b"res"+bytes([0])+b"erve"),
    GOOD.replace(b"reserve","résérve".encode("utf8")),
    GOOD.replace(b"reserve","re\u0301serve".encode("utf8")),
    GOOD.replace(b"reserve",b"RESERVE"),
    GOOD.replace(b"reserve",b"reserve\\\\"),
    GOOD.replace(b"reserve",b"reserve\r"),
    GOOD.replace(b"reserve",b"reserve\n"),
    GOOD.replace(b"12345",b"1e4"),
    GOOD.replace(b"12345",b"1.2345e4"),
    GOOD.replace(b"12345",b"-0"),
    GOOD.replace(b"12345",b"00012345"),
    GOOD.replace(b"12345",b"12345.00"),
    GOOD.replace(b"12345",b"1_2345"),
    GOOD.replace(b"12345",b"1,2345"),
    GOOD.replace(b"12345",b"1e9999"),
    GOOD.replace(b"12345",b"1e-9999"),
    GOOD.replace(b'"currency":"USD"',b'"currency":"USD","currency":"EUR"'),
    GOOD.replace(b'"version":"ED-OP-v1"',b'"version":"ED-OP-v1","version":"ED-OP-v1"'),
    GOOD.replace(b'"action":"reserve"',b'"action":"reserve","action":"reserve"'),
    GOOD.replace(b'"amount_minor":12345',b'"amount_minor":12345,"amount_minor":12345'),
    GOOD.replace(b'"amount_minor":12345',b'"amount_minor":12345,"nested":{"x":1,"x":2}'),
    GOOD.replace(b'"amount_minor":12345',b'"amount_minor":12345,"currency\\u0022":"EUR"'),
]:
    rejects(raw)
# Stable bytes across JSON key permutation, whitespace and repeated parse.
variants=[GOOD,REORDER,padded,
          b'{"currency":"USD","version":"ED-OP-v1","amount_minor":12345,"action":"reserve"}']
outputs=[accepts(x) for x in variants]
assert len(set(outputs))==1
assert len({sha256(x.encode("ascii")).hexdigest() for x in outputs})==1

# All database calls use synthetic PostgreSQL identities only.
def as_role(role,sql,expect_success=True):
    env={**os.environ,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role}
    result=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],
                          env=env,text=True,capture_output=True,timeout=20)
    if (result.returncode==0)!=expect_success:
        raise AssertionError((role,sql,result.stderr))
    return result.stdout.strip() if expect_success else result.stderr
def reserve(key,raw):
    canonical=accepts(raw)
    return as_role("a","SELECT f6b23_synthetic.reserve(\'"+key+"\',\'"+canonical+"\'::jsonb);")
# Different identities may use same operation key without sharing state.
assert reserve("key-b25-isolate",GOOD)=="NEW"
assert as_role("b","SELECT f6b23_synthetic.reserve('key-b25-isolate','"+
               accepts(GOOD)+"'::jsonb);")=="NEW"
assert reserve("key-b25-isolate",GOOD)=="REPLAY"
assert as_role("b","SELECT f6b23_synthetic.reserve('key-b25-isolate','"+
               accepts(GOOD)+"'::jsonb);")=="REPLAY"
# Retry after rollback: no operation key committed by the aborted transaction.
key="key-b25-rollback"
sql="BEGIN; SELECT f6b23_synthetic.reserve('"+key+"','"+accepts(GOOD)+"'::jsonb); ROLLBACK;"
as_role("a",sql)
assert reserve(key,GOOD)=="NEW"
assert reserve(key,GOOD)=="REPLAY"
# Concurrent same-identity retries: exactly one NEW and all others REPLAY.
def same(i):
    return reserve("key-b25-concurrent",GOOD if i%2 else REORDER)
with ThreadPoolExecutor(max_workers=4) as pool:
    got=list(pool.map(same,range(8)))
assert got.count("NEW")==1 and got.count("REPLAY")==7,got
# A different payload for a committed key must conflict without mutating it.
changed=GOOD.replace(b"12345",b"12346")
assert reserve("key-b25-concurrent",changed)=="CONFLICT"
assert reserve("key-b25-concurrent",GOOD)=="REPLAY"
# Unprivileged identity cannot invoke SECURITY DEFINER function.
err=as_role("stranger","SELECT f6b23_synthetic.reserve('key-b25-foreign','"+
            accepts(GOOD)+"'::jsonb);",False)
assert "permission denied" in err
print("PASS F6-B25 raw boundaries, Unicode/escape fail-closed, duplicates, parser-stable bytes, tenant isolation, rollback and concurrent retries")
