#!/usr/bin/env python3
"""F6-B20: disposable PostgreSQL, two psql sessions, synthetic payload digests."""
import os
import subprocess
import time

F="f6b20_synthetic.reserve_operation"
A="a"*64
B="b"*64
def call(client,key,digest,address="Calle Ficticia 100"):
    return f"{F}({client},'{key}','{digest}','{address}')"
def sql(command,ok=True,timeout=25):
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",command],
                     capture_output=True,text=True,env=os.environ.copy(),timeout=timeout)
    if (p.returncode==0)!=ok:
        raise AssertionError(f"unexpected SQL status: {p.stderr[-500:]} / {p.stdout[-500:]}")
    return p
def result(command,expected):
    p=sql(command)
    if expected not in p.stdout.splitlines():
        raise AssertionError(f"expected {expected}: {p.stdout!r}")
def invoke(client,key,digest,address="Calle Ficticia 100"):
    return "SET ROLE f6b20_caller; SELECT "+call(client,key,digest,address)+";"
def count(n):
    result("SELECT count(*) FROM f6b20_synthetic.operations",str(n))
def begin_hold(client,key,digest):
    return subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
        "BEGIN; SET ROLE f6b20_caller; SELECT "+call(client,key,digest)+"; SELECT pg_sleep(4); COMMIT;"],
        stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=os.environ.copy())
def wait_hold(p):
    deadline=time.monotonic()+12
    while time.monotonic()<deadline:
        if p.poll() is not None:
            raise AssertionError("holder exited before hold")
        activity=sql("SELECT count(*) FROM pg_stat_activity WHERE query LIKE '%pg_sleep(4); COMMIT%' AND state='active' AND wait_event_type='Timeout' AND pid<>pg_backend_pid()").stdout.strip()
        if activity.isdigit() and int(activity)>0:
            return
        time.sleep(.1)
    raise AssertionError("holder never reached hold")
count(0)
result(invoke(21,"operation-001",A),"NEW_SYNTHETIC")
result(invoke(21,"operation-001",A),"REPLAY_SYNTHETIC")
result(invoke(21,"operation-001",B),"CONFLICT_SYNTHETIC")
result(invoke(21,"operation-001",A,"Calle Ficticia 200"),"CONFLICT_SYNTHETIC")
result(invoke(21,"operation-002",A),"NEW_SYNTHETIC") # Same address, new operation.
result(invoke(22,"operation-001",A),"NEW_SYNTHETIC") # Same key, different client.
count(3)
# Savepoint and transaction rollback.
sql("BEGIN; SET ROLE f6b20_caller; SELECT "+call(23,"operation-003",A)+"; ROLLBACK;")
count(3)
result(invoke(23,"operation-003",A),"NEW_SYNTHETIC")
count(4)
# Two sessions compete for identical operation key. UNIQUE conflict serializes.
p=begin_hold(24,"operation-004",A)
try:
    wait_hold(p)
    retry=sql(invoke(24,"operation-004",A),timeout=20)
    out,err=p.communicate(timeout=12)
    if p.returncode!=0 or "NEW_SYNTHETIC" not in out or "REPLAY_SYNTHETIC" not in retry.stdout:
        raise AssertionError("concurrent same-payload retry: "+repr((out,err,retry.stdout)))
finally:
    if p.poll() is None: p.kill();p.communicate()
count(5)
# Competing different payload must conflict, not silently replay.
p=begin_hold(25,"operation-005",A)
try:
    wait_hold(p)
    retry=sql(invoke(25,"operation-005",B),timeout=20)
    out,err=p.communicate(timeout=12)
    if p.returncode!=0 or "NEW_SYNTHETIC" not in out or "CONFLICT_SYNTHETIC" not in retry.stdout:
        raise AssertionError("concurrent conflicting payload: "+repr((out,err,retry.stdout)))
finally:
    if p.poll() is None: p.kill();p.communicate()
count(6)
# Negative permissions, invalid payload and direct table access.
for command in (
    "SET ROLE f6b20_caller; SELECT count(*) FROM f6b20_synthetic.operations;",
    "SET ROLE f6b20_caller; DELETE FROM f6b20_synthetic.operations;",
    "SET ROLE f6b20_stranger; SELECT "+call(26,"operation-006",A)+";",
):
    p=sql(command,ok=False)
    if "permission denied" not in p.stderr:
        raise AssertionError("expected ACL denial: "+p.stderr[-500:])
invalid=sql(invoke(26,"operation-006","not-a-sha256"),ok=False)
if "invalid synthetic operation" not in invalid.stderr:
    raise AssertionError("invalid digest not rejected")
count(6)
# Expiry is conceptual ONLY: old keys remain reserved; no cleanup task or TTL activated.
result(invoke(21,"operation-001",A),"REPLAY_SYNTHETIC")
print("PASS F6-B20: operation retries, payload conflicts, concurrent sessions, rollback, ACL/RLS, no TTL")
