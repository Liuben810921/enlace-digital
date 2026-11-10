#!/usr/bin/env python3
"""F6-B18: two independent psql sessions, synthetic-only PostgreSQL 17 CI service."""
import os
import subprocess
import time

FN="f6b18_synthetic.reserve_new"
CALL=f"{FN}(77,' Provincia Ficticia ','Municipio Ficticio','','Calle Inventada 100')"
ALT=f"{FN}(77,'Provincia\\u00a0Ficticia','Municipio Ficticio','','Calle Inventada 100')"
def psql(sql, *, success=True, timeout=25):
    result=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",sql],
                          capture_output=True,text=True,timeout=timeout,env=os.environ.copy())
    if success and result.returncode!=0:
        raise AssertionError(f"psql failed: {result.stderr[-800:]}")
    if not success and result.returncode==0:
        raise AssertionError("negative test unexpectedly succeeded")
    return result
def check_value(sql,expected):
    result=psql(sql)
    got=[x.strip() for x in result.stdout.splitlines() if x.strip() and x.strip() not in ("SET","RESET")]
    if expected not in got:
        raise AssertionError(f"expected {expected}, got {got}")
def count(expected):
    check_value("SELECT count(*) FROM f6b18_synthetic.prospective_keys",str(expected))

# Only synthetic fixture data, no historical table exists in the test schema.
count(0)
first_sql=f"BEGIN; SET ROLE f6b18_caller; SELECT {CALL}; SELECT pg_sleep(3); COMMIT;"
first=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",first_sql],
                       stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=os.environ.copy())
try:
    # Synchronize by observing synthetic pg_sleep, not by guessing a race from wall-clock sleeps.
    deadline=time.monotonic()+10
    while True:
        activity=psql("SELECT count(*) FROM pg_stat_activity WHERE query LIKE '%pg_sleep(3); COMMIT%' AND state='active' AND pid<>pg_backend_pid()").stdout.strip()
        if activity.isdigit() and int(activity)>0:
            break
        if first.poll() is not None or time.monotonic()>deadline:
            raise AssertionError("first session did not reach synthetic transaction hold")
        time.sleep(0.1)
    second=psql(f"SET ROLE f6b18_caller; SELECT {ALT};",timeout=20)
    out,err=first.communicate(timeout=15)
    if first.returncode!=0:
        raise AssertionError("first session failed: "+err[-800:])
    if "RESERVED_SYNTHETIC" not in out or "DUPLICATE_SYNTHETIC" not in second.stdout:
        raise AssertionError(f"concurrency failed first={out!r} second={second.stdout!r}")
finally:
    if first.poll() is None:
        first.kill()
        first.communicate()
count(1)
# Same request repeated => idempotent reservation, no second row.
check_value(f"SET ROLE f6b18_caller; SELECT {CALL};","DUPLICATE_SYNTHETIC")
count(1)
# Different customer can use the same address; distinct address for same customer allowed.
check_value(f"SET ROLE f6b18_caller; SELECT {FN}(78,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 100');","RESERVED_SYNTHETIC")
check_value(f"SET ROLE f6b18_caller; SELECT {FN}(77,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 200');","RESERVED_SYNTHETIC")
count(3)
# Transaction rollback must not retain prospective reservation.
psql(f"BEGIN; SET ROLE f6b18_caller; SELECT {FN}(77,'Provincia Ficticia','Municipio Ficticio','','Calle Inventada 300'); ROLLBACK;")
count(3)
# Negative RLS/ACL: no direct table read or insert and no unapproved function EXECUTE.
for sql in [
    "SET ROLE f6b18_caller; SELECT count(*) FROM f6b18_synthetic.prospective_keys;",
    "SET ROLE f6b18_caller; INSERT INTO f6b18_synthetic.prospective_keys(cliente_numero,p,m,b,d) VALUES(1,'a'::bytea,'b'::bytea,'c'::bytea,'d'::bytea);",
    f"SET ROLE f6b18_stranger; SELECT {CALL};",
    f"SET ROLE f6b18_caller; SELECT {FN}(77,'Provincia Ficticia','Municipio Ficticio','','a');",
]:
    # Invalid input has a different expected SQLSTATE, verified separately below.
    if ",'a');" in sql:
        result=psql(sql,success=False)
        if "invalid field" not in result.stderr:
            raise AssertionError("invalid length not rejected")
    else:
        result=psql(sql,success=False)
        if "permission denied" not in result.stderr:
            raise AssertionError("unexpected negative failure: "+result.stderr[-600:])
count(3)
print("PASS F6-B18: 2 sessions, atomic conflict, 3 keys, idempotence, rollback, ACL/RLS, invalid input")
