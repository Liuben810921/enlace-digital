#!/usr/bin/env python3
"""F6-B26: isolated crash/rollback, concurrency and least-privilege checks."""
import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256

# Load only the lexical parser, never re-run earlier fixtures.
source=open("scripts/run_f6b24_raw_json_contract_isolated.py",encoding="utf8").read().split("GOOD=b",1)[0]
scope={}
exec(compile(source,"f6b24_parser_only","exec"),scope)
strict=scope["strict"]
Reject=scope["Reject"]
RAW=b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
PERMUTED=b' { "currency":"USD", "amount_minor":12345, "version":"ED-OP-v1", "action":"reserve" } '
DIFFERENT=RAW.replace(b"12345",b"12346")
assert strict(RAW)==strict(PERMUTED)
assert sha256(strict(RAW).encode()).digest()==sha256(strict(PERMUTED).encode()).digest()

def run(role,statement,success=True,timeout=20):
    env={**os.environ,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role}
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",statement],
                     env=env,text=True,capture_output=True,timeout=timeout)
    if (p.returncode==0)!=success:
        raise AssertionError((role,statement,p.stdout,p.stderr))
    return p.stdout.strip() if success else p.stderr

def reserve(role,key,raw):
    return run(role,"SELECT f6b23_synthetic.reserve('"+key+"','"+strict(raw)+"'::jsonb);")

# A committed request must replay after a fresh session, including key reordering.
assert reserve("a","key-b26-commit",RAW)=="NEW"
assert reserve("a","key-b26-commit",PERMUTED)=="REPLAY"
assert reserve("a","key-b26-commit",DIFFERENT)=="CONFLICT"
assert reserve("a","key-b26-commit",RAW)=="REPLAY"
# Rollback in a completed transaction: no key is consumed.
statement="BEGIN; SELECT f6b23_synthetic.reserve('key-b26-abort','"+strict(RAW)+"'::jsonb); ROLLBACK;"
run("a",statement)
assert reserve("a","key-b26-abort",RAW)=="NEW"
# Abrupt termination of the client while a transaction is open.
# The uncommitted insert is rolled back by PostgreSQL on connection loss.
key="key-b26-crash"
env={**os.environ,"PGUSER":"f6b23_a","PGPASSWORD":"synthetic_b23_a"}
sql="BEGIN; SELECT f6b23_synthetic.reserve('"+key+"','"+strict(RAW)+"'::jsonb); SELECT pg_sleep(30);"
p=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],
                   env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
try:
    # Wait until the transaction inserted the key, then terminate its connection.
    ready=False
    for _ in range(80):
        status=run("a","SELECT count(*) FROM pg_stat_activity WHERE usename='f6b23_a' AND state='active' AND query LIKE '%pg_sleep(30)%';")
        if int(status)>0:
            # pg_stat_activity alone does not guarantee insert completion;
            # confirm via a separate privileged observer seeing an uncommitted lock.
            lock=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
                "SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a USING(pid) WHERE a.usename='f6b23_a' AND a.query LIKE '%pg_sleep(30)%' AND l.mode='RowExclusiveLock' AND l.granted;"],
                env=os.environ,capture_output=True,text=True,timeout=10)
            if lock.returncode==0 and int(lock.stdout.strip())>0:
                ready=True
                break
        if p.poll() is not None: break
        time.sleep(0.1)
    assert ready,"transaction did not reach uncommitted write"
finally:
    p.kill()
    p.communicate(timeout=10)
# Wait for server to notice disconnected client; a fresh insert must succeed.
assert reserve("a",key,RAW)=="NEW"
assert reserve("a",key,RAW)=="REPLAY"

# Same key is scoped by the authenticated database role, not supplied payload.
assert reserve("b","key-b26-commit",DIFFERENT)=="NEW"
assert reserve("b","key-b26-commit",RAW)=="CONFLICT"
assert reserve("a","key-b26-commit",RAW)=="REPLAY"
# Mixed concurrent replays/conflicts, 2 identities with same key.
def attempt(pair):
    role,i=pair
    raw=RAW if role=="a" else DIFFERENT
    return role,reserve(role,"key-b26-race",raw if i%2 else PERMUTED if role=="a" else raw)
with ThreadPoolExecutor(max_workers=8) as pool:
    outcomes=list(pool.map(attempt,[(role,i) for role in ("a","b") for i in range(8)]))
for role in ("a","b"):
    results=[value for who,value in outcomes if who==role]
    assert results.count("NEW")==1 and results.count("REPLAY")==7,(role,results)
# Retry after a conflicting payload cannot poison a valid key.
assert reserve("a","key-b26-race",DIFFERENT)=="CONFLICT"
assert reserve("a","key-b26-race",RAW)=="REPLAY"

# No direct table access, no role escalation and no EXECUTE for stranger.
for role in ("a","b","stranger"):
    err=run(role,"SELECT * FROM f6b23_synthetic.operations LIMIT 1;",False)
    assert "permission denied" in err,err
    err=run(role,"INSERT INTO f6b23_synthetic.operations(identity_name,operation_key,digest) VALUES ('f6b23_a','key-b26-direct',decode(repeat('00',32),'hex'));",False)
    assert "permission denied" in err,err
    err=run(role,"SET ROLE f6b23_owner;",False)
    assert "permission denied" in err,err
err=run("stranger","SELECT f6b23_synthetic.reserve('key-b26-foreign','"+strict(RAW)+"'::jsonb);",False)
assert "permission denied" in err,err
print("PASS F6-B26 crash rollback, committed replay, concurrent retries, identity isolation, canonical hash and least privilege")
