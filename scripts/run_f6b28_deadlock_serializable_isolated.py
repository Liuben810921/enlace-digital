#!/usr/bin/env python3
"""F6-B28: synthetic PostgreSQL deadlock, serialization, timeout and idempotency."""
import os
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256

ADMIN={**os.environ,"PGUSER":"postgres","PGPASSWORD":"synthetic_ci_only"}
RAW=b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
ALT=b' { "currency":"USD", "amount_minor":12345, "version":"ED-OP-v1", "action":"reserve" } '
OTHER=RAW.replace(b"12345",b"12346")
scope={}
source=open("scripts/run_f6b24_raw_json_contract_isolated.py",encoding="utf8").read().split("GOOD=b",1)[0]
exec(compile(source,"f6b24_parser_only","exec"),scope)
strict=scope["strict"]
assert strict(RAW)==strict(ALT)
assert sha256(strict(RAW).encode()).digest()==sha256(strict(ALT).encode()).digest()

def execute(query,role="postgres",timeout=20):
    env=ADMIN if role=="postgres" else {**os.environ,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role}
    return subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-v","VERBOSITY=verbose","-c",query],
                          env=env,capture_output=True,text=True,timeout=timeout)
def good(query,role="postgres"):
    r=execute(query,role)
    assert r.returncode==0,(query,r.stdout,r.stderr)
    return r.stdout.strip()
def state(r,expected):
    assert r.returncode!=0,(r.stdout,r.stderr)
    assert re.search(r"\\b"+expected+r"\\b",r.stderr),(expected,r.stderr)
def reserve(role,key,raw=RAW):
    return good("SELECT f6b23_synthetic.reserve('"+key+"','"+strict(raw)+"'::jsonb);",role)

good("CREATE SCHEMA IF NOT EXISTS f6b28_synthetic; "
     "CREATE TABLE f6b28_synthetic.locks(id int PRIMARY KEY, value int NOT NULL); "
     "INSERT INTO f6b28_synthetic.locks VALUES (1,0),(2,0);")
# Deterministic lock order inversion: two transactions each acquire one row
# before requesting the other. deadlock_timeout=100ms speeds detection.
a=("BEGIN; SET LOCAL deadlock_timeout='100ms'; "
   "UPDATE f6b28_synthetic.locks SET value=value+1 WHERE id=1; "
   "SELECT pg_sleep(0.7); "
   "UPDATE f6b28_synthetic.locks SET value=value+1 WHERE id=2; COMMIT;")
b=("BEGIN; SET LOCAL deadlock_timeout='100ms'; "
   "UPDATE f6b28_synthetic.locks SET value=value+1 WHERE id=2; "
   "SELECT pg_sleep(0.7); "
   "UPDATE f6b28_synthetic.locks SET value=value+1 WHERE id=1; COMMIT;")
with ThreadPoolExecutor(max_workers=2) as pool:
    first,second=list(pool.map(execute,(a,b)))
assert sum(x.returncode==0 for x in (first,second))==1,(first.stderr,second.stderr)
victim=first if first.returncode!=0 else second
state(victim,"40P01")
# Retry entire transaction after deadlock: the victim's earlier writes rolled back.
retry=a if first.returncode!=0 else b
assert execute(retry).returncode==0
assert good("SELECT string_agg(id||':'||value,',' ORDER BY id) FROM f6b28_synthetic.locks;")=="1:2,2:2"

# SERIALIZABLE transactions read the same snapshot and attempt a concurrent
# update of one row. One must fail 40001; retry requires a NEW transaction.
good("CREATE TABLE f6b28_synthetic.serial(id int PRIMARY KEY, value int NOT NULL); "
     "INSERT INTO f6b28_synthetic.serial VALUES (1,0);")
serial=("BEGIN ISOLATION LEVEL SERIALIZABLE; "
        "SELECT value FROM f6b28_synthetic.serial WHERE id=1; "
        "SELECT pg_sleep(0.7); "
        "UPDATE f6b28_synthetic.serial SET value=value+1 WHERE id=1; COMMIT;")
with ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(execute,(serial,serial)))
assert sum(x.returncode==0 for x in results)==1,[x.stderr for x in results]
state(next(x for x in results if x.returncode!=0),"40001")
assert execute(serial).returncode==0
assert good("SELECT value FROM f6b28_synthetic.serial WHERE id=1;")=="2"

# SQLSTATE 57014: statement_timeout aborts a statement, not an idempotency key.
timed=execute("SET statement_timeout='100ms'; SELECT pg_sleep(1);")
state(timed,"57014")
# SQLSTATE 55P03: lock_timeout while another transaction holds a row.
holder=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
  "BEGIN; UPDATE f6b28_synthetic.serial SET value=value WHERE id=1; "
  "SELECT pg_sleep(2); ROLLBACK;"],env=ADMIN,capture_output=True,text=True)
try:
    import time
    ready=False
    for _ in range(70):
        q=execute("SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a USING(pid) "
                  "WHERE a.usename='postgres' AND a.query LIKE '%f6b28_synthetic.serial%' "
                  "AND a.query LIKE '%pg_sleep(2)%' AND l.mode='RowExclusiveLock' AND l.granted;")
        if q.returncode==0 and int(q.stdout.strip())>0:
            ready=True
            break
        if holder.poll() is not None: break
        time.sleep(.05)
    assert ready,"lock holder did not reach uncommitted write"
    locked=execute("SET lock_timeout='100ms'; UPDATE f6b28_synthetic.serial "
                   "SET value=value+1 WHERE id=1;")
    state(locked,"55P03")
finally:
    holder.communicate(timeout=8)
assert good("SELECT value FROM f6b28_synthetic.serial WHERE id=1;")=="2"

# Contractual identity and retry invariants after transient SQL failures.
def race(item):
    role,i=item
    return role,reserve(role,"key-b28-race",ALT if role=="a" and i%2 else RAW if role=="a" else OTHER)
with ThreadPoolExecutor(max_workers=8) as pool:
    out=list(pool.map(race,[(role,i) for role in ("a","b") for i in range(8)]))
for role in ("a","b"):
    vals=[v for who,v in out if who==role]
    assert vals.count("NEW")==1 and vals.count("REPLAY")==7,(role,vals)
assert reserve("a","key-b28-race",OTHER)=="CONFLICT"
assert reserve("b","key-b28-race",RAW)=="CONFLICT"
assert reserve("a","key-b28-race",ALT)=="REPLAY"
# Identity privileges cannot bypass RLS/ACL to modify the fixture.
for role in ("a","b","stranger"):
    for query in ("SELECT * FROM f6b23_synthetic.operations;",
                  "UPDATE f6b23_synthetic.operations SET operation_key='forged';",
                  "SET ROLE f6b23_owner;"):
        r=execute(query,role)
        assert r.returncode!=0 and "permission denied" in r.stderr,(role,r.stderr)
assert good("SELECT relrowsecurity::text||','||relforcerowsecurity::text "
            "FROM pg_class WHERE oid='f6b23_synthetic.operations'::regclass;")=="true,true"
print("PASS F6-B28 40P01/40001 full-transaction retries, 57014/55P03 timeouts, identity and ACL/RLS")
