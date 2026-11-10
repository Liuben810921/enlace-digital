#!/usr/bin/env python3
"""F6-B19: failure/retry synthetic tests, disposable PostgreSQL CI ONLY."""
import os
import subprocess
import time

FN="f6b18_synthetic.reserve_new"
BASE="'Provincia Ficticia','Municipio Ficticio','','Calle Inventada "
def call(customer,street):
    return f"{FN}({customer},{BASE}{street}')"
def psql(sql, expect=True, timeout=25):
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],
        capture_output=True,text=True,timeout=timeout,env=os.environ.copy())
    if expect and p.returncode!=0:
        raise AssertionError(f"unexpected SQL failure: {p.stderr[-500:]}")
    if not expect and p.returncode==0:
        raise AssertionError("expected SQL failure")
    return p
def assert_value(sql,value):
    p=psql(sql)
    if value not in p.stdout.splitlines():
        raise AssertionError(f"expected {value!r}, got {p.stdout!r}")
def total(n):
    assert_value("SELECT count(*) FROM f6b18_synthetic.prospective_keys",str(n))
def role_call(c,street):
    return "SET ROLE f6b18_caller; SELECT "+call(c,street)+";"
def wait_for_sleep(process,deadline=12):
    until=time.monotonic()+deadline
    while time.monotonic()<until:
        if process.poll() is not None:
            raise AssertionError("session exited before hold")
        p=psql("SELECT count(*) FROM pg_stat_activity WHERE query LIKE '%pg_sleep(4); COMMIT%' AND state='active' AND pid<>pg_backend_pid()")
        if p.stdout.strip().isdigit() and int(p.stdout.strip())>0:
            return
        time.sleep(.1)
    raise AssertionError("session did not reach hold")
def background(sql):
    return subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],
        stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=os.environ.copy())

total(0)
# A process is killed after writing but BEFORE COMMIT; PostgreSQL must roll back the uncommitted key.
first=background("BEGIN; SET ROLE f6b18_caller; SELECT "+call(91,901)+"; SELECT pg_sleep(4); COMMIT;")
try:
    wait_for_sleep(first)
    first.kill()
    first.communicate(timeout=10)
finally:
    if first.poll() is None:
        first.kill(); first.communicate()
total(0)
assert_value(role_call(91,901),"RESERVED_SYNTHETIC")
total(1)
# A committed request with a lost response must not create a second key.
assert_value(role_call(91,901),"DUPLICATE_SYNTHETIC")
total(1)
# Explicit rollback and savepoint failure must not leave a key.
psql("BEGIN; SET ROLE f6b18_caller; SELECT "+call(92,902)+"; ROLLBACK;")
total(1)
psql("BEGIN; SET ROLE f6b18_caller; SAVEPOINT before_reserve; SELECT "+call(92,903)+"; ROLLBACK TO SAVEPOINT before_reserve; COMMIT;")
total(1)
# After a failed validation, a valid new request can succeed (no ghost reservation).
invalid=psql("SET ROLE f6b18_caller; SELECT "+FN+"(93,'Provincia Ficticia','Municipio Ficticio','','x');",expect=False)
if "invalid field" not in invalid.stderr:
    raise AssertionError("wrong validation failure")
assert_value(role_call(93,904),"RESERVED_SYNTHETIC")
total(2)
# A concurrent retry of an uncommitted transaction blocks and becomes DUPLICATE after commit.
first=background("BEGIN; SET ROLE f6b18_caller; SELECT "+call(94,905)+"; SELECT pg_sleep(4); COMMIT;")
try:
    wait_for_sleep(first)
    retry=psql(role_call(94,905),timeout=20)
    out,err=first.communicate(timeout=12)
    if first.returncode!=0 or "RESERVED_SYNTHETIC" not in out:
        raise AssertionError("first commit failed: "+err[-500:])
    if "DUPLICATE_SYNTHETIC" not in retry.stdout:
        raise AssertionError("retry did not detect committed key")
finally:
    if first.poll() is None:
        first.kill();first.communicate()
total(3)
# Same key from a different client is valid; NORM-v1 collapses NBSP and ordinary spaces.
assert_value(role_call(95,905),"RESERVED_SYNTHETIC")
total(4)
unicode_retry=f"SET ROLE f6b18_caller; SELECT {FN}(95,'Provincia\\u00a0Ficticia','Municipio Ficticio','','Calle Inventada 905');"
unicode_retry=unicode_retry.replace("\\u00a0","\u00a0")
assert_value(unicode_retry,"DUPLICATE_SYNTHETIC")
total(4)
# ACL/RLS: direct read, insert, role escalation, and unauthorized function invocation denied.
for query in (
    "SET ROLE f6b18_caller; SELECT count(*) FROM f6b18_synthetic.prospective_keys;",
    "SET ROLE f6b18_caller; INSERT INTO f6b18_synthetic.prospective_keys(cliente_numero,p,m,b,d) VALUES(96,'a'::bytea,'b'::bytea,'c'::bytea,'d'::bytea);",
    "SET ROLE f6b18_stranger; SELECT "+call(96,906)+";",
    "SET ROLE f6b18_caller; SELECT f6b18_synthetic.keypart('Calle Inventada 900',8,500);",
):
    denied=psql(query,expect=False)
    if "permission denied" not in denied.stderr:
        raise AssertionError("expected permission denial: "+denied.stderr[-500:])
total(4)
psql("DO $x$ BEGIN IF pg_has_role('f6b18_caller','f6b18_owner','SET') THEN RAISE EXCEPTION 'SET ROLE escalation'; END IF; IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='f6b18_synthetic.prospective_keys'::regclass) THEN RAISE EXCEPTION 'RLS disabled'; END IF; END $x$;")
print("PASS F6-B19: killed precommit rollback, lost-response retry, savepoint, invalid input, two-session race, Unicode, ACL and RLS")
