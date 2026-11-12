#!/usr/bin/env python3
"""F6-B27: cancellation, transient lock failure, retry and ACL/RLS; disposable CI."""
import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

source=open("scripts/run_f6b24_raw_json_contract_isolated.py",encoding="utf8").read().split("GOOD=b",1)[0]
scope={}
exec(compile(source,"f6b24_parser_only","exec"),scope)
strict=scope["strict"]
RAW=b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
REORDER=b' { "amount_minor":12345, "currency":"USD", "action":"reserve", "version":"ED-OP-v1" } '
CHANGED=RAW.replace(b"12345",b"12346")
assert strict(RAW)==strict(REORDER)
def sql(role,query,ok=True,timeout=15):
    env={**os.environ,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role}
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",query],
                     env=env,text=True,capture_output=True,timeout=timeout)
    if (p.returncode==0)!=ok: raise AssertionError((role,query,p.stdout,p.stderr))
    return p.stdout.strip() if ok else p.stderr
def reserve(role,key,payload=RAW):
    return sql(role,"SELECT f6b23_synthetic.reserve('"+key+"','"+strict(payload)+"'::jsonb);")

# Transaction abort on a deliberate SQL error: no idempotency key committed.
key="key-b27-error"
err=sql("a","BEGIN; SELECT f6b23_synthetic.reserve('"+key+"','"+strict(RAW)+
        "'::jsonb); SELECT 1/0; COMMIT;",False)
assert "division by zero" in err,err
assert reserve("a",key)=="NEW"
assert reserve("a",key,REORDER)=="REPLAY"

# Hold an uncommitted synthetic reservation, then force statement_timeout on
# competing reservation. The lock timeout must not consume or mutate the key.
key="key-b27-timeout"
env={**os.environ,"PGUSER":"f6b23_a","PGPASSWORD":"synthetic_b23_a"}
holder=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
    "BEGIN; SELECT f6b23_synthetic.reserve('"+key+"','"+strict(RAW)+
    "'::jsonb); SELECT pg_sleep(25); ROLLBACK;"],
    env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
try:
    # Detect actual uncommitted insert using a granted RowExclusiveLock.
    # Observer is the disposable CI postgres superuser only.
    ready=False
    for _ in range(100):
        q=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
          "SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a USING(pid) "
          "WHERE a.usename='f6b23_a' AND a.query LIKE '%key-b27-timeout%' "
          "AND l.mode='RowExclusiveLock' AND l.granted;"],
          env=os.environ,capture_output=True,text=True,timeout=5)
        if q.returncode==0 and int(q.stdout.strip())>0:
            ready=True
            break
        if holder.poll() is not None: break
        time.sleep(.1)
    assert ready,"uncommitted synthetic reservation not observed"
    conflict=sql("a","SET statement_timeout='250ms'; SELECT f6b23_synthetic.reserve('"+
                 key+"','"+strict(RAW)+"'::jsonb);",False)
    assert "statement timeout" in conflict,conflict
finally:
    # Cancel the exact holder query, then allow its explicit ROLLBACK.
    # pg_cancel_backend terminates pg_sleep, which aborts the open transaction.
    q=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
      "SELECT pg_cancel_backend(pid) FROM pg_stat_activity "
      "WHERE usename='f6b23_a' AND query LIKE '%key-b27-timeout%' AND pid<>pg_backend_pid();"],
      env=os.environ,capture_output=True,text=True,timeout=10)
    holder.communicate(timeout=10)
assert reserve("a",key)=="NEW"
assert reserve("a",key,REORDER)=="REPLAY"
assert reserve("a",key,CHANGED)=="CONFLICT"
assert reserve("b",key,CHANGED)=="NEW"
assert reserve("b",key,RAW)=="CONFLICT"

# Concurrent retry storms: per-identity uniqueness and no cross-tenant sharing.
def call(item):
    role,i=item
    return role,reserve(role,"key-b27-storm",RAW if role=="a" and i%2 else
                        REORDER if role=="a" else CHANGED)
with ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(call,[(role,i) for role in ("a","b") for i in range(10)]))
for role in ("a","b"):
    vals=[v for r,v in results if r==role]
    assert vals.count("NEW")==1 and vals.count("REPLAY")==9,(role,vals)
assert reserve("a","key-b27-storm",CHANGED)=="CONFLICT"
assert reserve("b","key-b27-storm",RAW)=="CONFLICT"

# Catalog-level ACL/RLS verification from disposable administrator, plus
# negative tests as each restricted synthetic login.
check=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
    "SELECT relrowsecurity::text||','||relforcerowsecurity::text FROM pg_class "
    "WHERE oid='f6b23_synthetic.operations'::regclass;"],
    env=os.environ,text=True,capture_output=True,timeout=10)
assert check.returncode==0 and check.stdout.strip()=="true,true",check.stderr
for role in ("a","b","stranger"):
    for query in ("SELECT * FROM f6b23_synthetic.operations;",
                  "DELETE FROM f6b23_synthetic.operations;",
                  "UPDATE f6b23_synthetic.operations SET operation_key='other';",
                  "TRUNCATE f6b23_synthetic.operations;",
                  "SET ROLE f6b23_owner;"):
        err=sql(role,query,False)
        assert "permission denied" in err,err
err=sql("stranger","SELECT f6b23_synthetic.reserve('key-b27-stranger','"+
        strict(RAW)+"'::jsonb);",False)
assert "permission denied" in err,err
print("PASS F6-B27 cancellation, transient timeout, rollback, concurrent retry, identity and ACL/RLS")
