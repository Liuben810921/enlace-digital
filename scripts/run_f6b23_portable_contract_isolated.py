#!/usr/bin/env python3
"""F6-B23 isolated contract vectors, no production/staging endpoints."""
import os,subprocess,hashlib
BASE=os.environ.copy()
def query(role,sql,ok=True):
    env={**BASE,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role}
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],env=env,text=True,capture_output=True,timeout=20)
    if (p.returncode==0)!=ok: raise AssertionError((role,sql,p.stderr))
    return p.stdout.strip() if ok else p.stderr
def op(key,p):
    return "SELECT f6b23_synthetic.reserve('"+key+"','"+p+"'::jsonb);"
base='{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
reordered=' { "amount_minor":12345, "currency":"USD", "action":"reserve", "version":"ED-OP-v1" } '
def expect(role,key,p,value):
    got=query(role,op(key,p))
    if got!=value: raise AssertionError((role,key,got,value))
expect("a","key-0001",base,"NEW")
expect("a","key-0001",reordered,"REPLAY")
expect("b","key-0001",base,"NEW")
expect("a","key-0001",base.replace("12345","12346"),"CONFLICT")
expect("a","key-0002",base,"NEW")
expect("a","key-0002",base,"REPLAY")
# Python independent reference encoding: never hash JSON serialization.
canonical=b"ED-OP-v1\nreserve\nUSD\n12345"
digest=hashlib.sha256(canonical).hexdigest()
env={**BASE,"PGUSER":"postgres"}
got=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
 "SELECT encode(digest,'hex') FROM f6b23_synthetic.operations WHERE identity_name='f6b23_a' AND operation_key='key-0001';"],env=env,text=True,capture_output=True,check=True).stdout.strip()
if got!=digest: raise AssertionError(("cross-language hash mismatch",got,digest))
invalid=[
 ("short",base),
 ("key-null","null"),
 ("key-array",'[1,2]'),
 ("key-version",base.replace("ED-OP-v1","ED-OP-v2")),
 ("key-amountfloat",base.replace("12345","12345.0")),
 ("key-amountnegative",base.replace("12345","-1")),
 ("key-amountstring",base.replace("12345",'"12345"')),
 ("key-amountbool",base.replace("12345","true")),
 ("key-amountbig",base.replace("12345","1234567890123456")),
 ("key-actionunicode",base.replace("reserve","réserve")),
 ("key-actionupper",base.replace("reserve","Reserve")),
 ("key-actionnewline",base.replace("reserve","res\\nuve")),
 ("key-currency",base.replace("USD","usd")),
 ("key-clientid",base[:-1]+',"client_id":"f6b23_b"}'),
 ("key-duplicate",base[:-1]+',"unexpected":0}'),
 ("key-missing",'{"version":"ED-OP-v1","action":"reserve","currency":"USD"}'),
]
for key,p in invalid:
    err=query("a",op(key,p),False)
    if "invalid contract" not in err: raise AssertionError((key,err))
# No key consumed after validation failure.
expect("a","key-null",base,"NEW")
# Rollback does not reserve an operation.
query("a","BEGIN; "+op("key-rollback",base)+" ROLLBACK;")
expect("a","key-rollback",base,"NEW")
for statement in ["SELECT * FROM f6b23_synthetic.operations;",
                  "DELETE FROM f6b23_synthetic.operations;",
                  "TRUNCATE f6b23_synthetic.operations;",
                  "SET ROLE f6b23_b;"]:
    err=query("a",statement,False)
    if "permission denied" not in err: raise AssertionError(err)
err=query("stranger",op("key-stranger",base),False)
if "permission denied" not in err: raise AssertionError(err)
print("PASS F6-B23 versioned byte contract, independent SHA256, identity isolation, rejects, rollback, ACL/RLS")
