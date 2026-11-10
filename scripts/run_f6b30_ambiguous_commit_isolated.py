#!/usr/bin/env python3
"""F6-B30: synthetic ambiguous client acknowledgement around COMMIT."""
import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

source=open("scripts/run_f6b24_raw_json_contract_isolated.py",encoding="utf8").read().split("GOOD=b",1)[0]
scope={}
exec(compile(source,"parser_only","exec"),scope)
strict=scope["strict"]
RAW=b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
ALT=b' { "amount_minor":12345, "currency":"USD", "action":"reserve", "version":"ED-OP-v1" } '
OTHER=RAW.replace(b"12345",b"12346")
assert strict(RAW)==strict(ALT)
def command(sql,role="a",timeout=15):
    env={**os.environ,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role} if role!="admin" else os.environ
    return subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],env=env,text=True,capture_output=True,timeout=timeout)
def ok(sql,role="a"):
    r=command(sql,role)
    assert r.returncode==0,(r.stdout,r.stderr)
    return r.stdout.strip()
def reserve(role,key,raw=RAW):
    return ok("SELECT f6b23_synthetic.reserve('"+key+"','"+strict(raw)+"'::jsonb);",role)

# Pre-COMMIT loss: transaction abort, key must remain free.
key="key-b30-before"
env={**os.environ,"PGUSER":"f6b23_a","PGPASSWORD":"synthetic_b23_a"}
before=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
    "BEGIN; SELECT f6b23_synthetic.reserve('"+key+"','"+strict(RAW)+"'::jsonb); SELECT pg_sleep(25); COMMIT;"],
    env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
try:
    pid=None
    for _ in range(100):
        r=command("SELECT a.pid FROM pg_stat_activity a JOIN pg_locks l USING(pid) "
            "WHERE a.usename='f6b23_a' AND a.query LIKE '%key-b30-before%' "
            "AND l.mode='RowExclusiveLock' AND l.granted LIMIT 1;","admin")
        if r.returncode==0 and r.stdout.strip().isdigit():
            pid=int(r.stdout.strip())
            break
        if before.poll() is not None: break
        time.sleep(.08)
    assert pid,"pre-commit transaction never reached uncommitted write"
    assert ok("SELECT pg_terminate_backend("+str(pid)+");","admin")=="t"
finally:
    before.communicate(timeout=10)
assert reserve("a",key)=="NEW"
assert reserve("a",key,ALT)=="REPLAY"

# Post-COMMIT loss: COMMIT has executed, but client never observes final success.
# Verify the commit from another session before terminating the sleeping backend.
key="key-b30-after"
after=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
    "BEGIN; SELECT f6b23_synthetic.reserve('"+key+"','"+strict(RAW)+"'::jsonb); COMMIT; SELECT pg_sleep(25);"],
    env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
try:
    pid=None
    for _ in range(100):
        r=command("SELECT pid FROM pg_stat_activity WHERE usename='f6b23_a' "
                  "AND query LIKE '%key-b30-after%' AND state='active' LIMIT 1;","admin")
        if r.returncode==0 and r.stdout.strip().isdigit():
            # Another connection confirms the COMMIT; REPLAY must be durable.
            # Avoid blocking if the transaction has not committed yet.
            probe=command("SET statement_timeout='150ms'; SELECT f6b23_synthetic.reserve('"+
                          key+"','"+strict(ALT)+"'::jsonb);")
            if probe.returncode==0 and probe.stdout.strip().splitlines()[-1]=="REPLAY":
                pid=int(r.stdout.strip())
                break
        if after.poll() is not None: break
        time.sleep(.08)
    assert pid,"post-commit durable replay not observed"
    assert ok("SELECT pg_terminate_backend("+str(pid)+");","admin")=="t"
finally:
    after.communicate(timeout=10)
assert reserve("a",key,ALT)=="REPLAY"
assert reserve("a",key,OTHER)=="CONFLICT"
assert reserve("b",key,OTHER)=="NEW"
assert reserve("b",key,RAW)=="CONFLICT"

# Bounded reconciliations never create duplicate operations per identity.
def attempt(pair):
    role,i=pair
    return role,reserve(role,"key-b30-storm",ALT if role=="a" and i%2 else RAW if role=="a" else OTHER)
with ThreadPoolExecutor(max_workers=8) as pool:
    out=list(pool.map(attempt,[(role,i) for role in ("a","b") for i in range(8)]))
for role in ("a","b"):
    values=[v for who,v in out if who==role]
    assert values.count("NEW")==1 and values.count("REPLAY")==7,(role,values)
assert reserve("a","key-b30-storm",OTHER)=="CONFLICT"
assert reserve("b","key-b30-storm",RAW)=="CONFLICT"
# Fail closed for non-owners.
for role in ("a","b","stranger"):
    r=command("SELECT * FROM f6b23_synthetic.operations;",role)
    assert r.returncode!=0 and "permission denied" in r.stderr,(role,r.stderr)
r=command("SELECT f6b23_synthetic.reserve('key-b30-stranger','"+strict(RAW)+"'::jsonb);","stranger")
assert r.returncode!=0 and "permission denied" in r.stderr,r.stderr
print("PASS F6-B30 pre/post-COMMIT client loss, durable replay, conflicts, concurrent identities and ACL")
