#!/usr/bin/env python3
"""F6-B21: synthetic database roles, disposable PostgreSQL only."""
import os, subprocess, time
BASE=os.environ.copy()
def run(user, statement, success=True, password=None, timeout=25):
    env={**BASE,"PGUSER":user,"PGPASSWORD":password or ("synthetic_"+user.removeprefix("f6b21_")+"_only")}
    p=subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",statement],
                     env=env,text=True,capture_output=True,timeout=timeout)
    if (p.returncode==0)!=success:
        raise AssertionError(f"{user} unexpected status {p.returncode}: {p.stderr[-500:]} {p.stdout[-500:]}")
    return p
def op(key, payload):
    return "SELECT f6b21_synthetic.reserve('"+key+"','"+payload+"'::jsonb);"
A='{"action":"reserve","amount":1}'
A_REORDER=' { "amount": 1, "action" : "reserve" } '
B='{"action":"reserve","amount":2}'
def expect(user,stmt,needle):
    out=run(user,stmt).stdout
    if needle not in out.splitlines(): raise AssertionError((user,needle,out))
def denied(user,stmt):
    p=run(user,stmt,False)
    if "permission denied" not in p.stderr: raise AssertionError(p.stderr)
expect("f6b21_a",op("key-0001",A),"NEW_SYNTHETIC")
expect("f6b21_a",op("key-0001",A_REORDER),"REPLAY_SYNTHETIC")
expect("f6b21_a",op("key-0001",B),"CONFLICT_SYNTHETIC")
expect("f6b21_b",op("key-0001",A),"NEW_SYNTHETIC")
expect("f6b21_b",op("key-0001",A),"REPLAY_SYNTHETIC")
denied("f6b21_a","SELECT * FROM f6b21_synthetic.operations;")
denied("f6b21_b","DELETE FROM f6b21_synthetic.operations;")
denied("f6b21_stranger",op("key-0001",A))
run("f6b21_a",op("key-0002",'{"action":"reserve","amount":1,"client_id":"f6b21_b"}'),False)
# SET ROLE cannot change session_user; a cannot impersonate b.
denied("f6b21_a","SET ROLE f6b21_b;")
# Rollback releases reservation.
run("f6b21_a","BEGIN; "+op("key-rollback",A)+" ROLLBACK;")
expect("f6b21_a",op("key-rollback",A),"NEW_SYNTHETIC")
# Concurrent transactions: one NEW and one REPLAY, or one NEW and one CONFLICT.
def concurrent(key, second_payload, expected):
    env={**BASE,"PGUSER":"f6b21_a","PGPASSWORD":"synthetic_a_only"}
    holder=subprocess.Popen(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1","-c",
       "BEGIN; "+op(key,A)+" SELECT pg_sleep(3); COMMIT;"],env=env,text=True,
       stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            # Observe hold only via ephemeral test superuser, not a client.
            status=run("postgres","SELECT count(*) FROM pg_stat_activity WHERE query LIKE '%pg_sleep(3); COMMIT%' AND state='active' AND wait_event_type='Timeout' AND pid<>pg_backend_pid();",password=BASE["PGPASSWORD"]).stdout.strip()
            if status.isdigit() and int(status)>0: break
            if holder.poll() is not None: raise AssertionError("holder exited early")
            time.sleep(.1)
        else: raise AssertionError("hold not observed")
        retry=run("f6b21_a",op(key,second_payload),timeout=15)
        out,err=holder.communicate(timeout=10)
        if holder.returncode or "NEW_SYNTHETIC" not in out or expected not in retry.stdout:
            raise AssertionError((out,err,retry.stdout))
    finally:
        if holder.poll() is None: holder.kill();holder.communicate()
concurrent("key-race-same",A,"REPLAY_SYNTHETIC")
concurrent("key-race-diff",B,"CONFLICT_SYNTHETIC")
expect("f6b21_a",op("key-0001",A),"REPLAY_SYNTHETIC")
# F6-B22: adversarial canonicalization and identity boundaries; no external effects.
# These checks assert observed PostgreSQL-specific distinctions, not cross-platform equivalence.
expect("f6b21_a",op("key-numeric",A),"NEW_SYNTHETIC")
expect("f6b21_a",op("key-numeric",'{"action":"reserve","amount":1.0}'),"CONFLICT_SYNTHETIC")
expect("f6b21_a",op("key-numeric",A_REORDER),"REPLAY_SYNTHETIC")
expect("f6b21_b",op("key-numeric",'{"action":"reserve","amount":1.0}'),"NEW_SYNTHETIC")
# NFC and NFD strings are not silently conflated by PostgreSQL JSONB.
expect("f6b21_a",op("key-unicode",'{"action":"caf\\u00e9","amount":1}'),"NEW_SYNTHETIC")
expect("f6b21_a",op("key-unicode",'{"action":"cafe\\u0301","amount":1}'),"CONFLICT_SYNTHETIC")
# Reject malformed shape, unexpected fields, invalid key and wrong scalar types.
invalid=[
    ('short',A), ('key-invalid-null','null'),
    ('key-invalid-array','[1,2]'),
    ('key-invalid-extra','{"action":"reserve","amount":1,"client_id":"f6b21_a"}'),
    ('key-invalid-string','{"action":"reserve","amount":"1"}'),
    ('key-invalid-bool','{"action":"reserve","amount":true}'),
    ('key-invalid-action','{"action":"","amount":1}'),
    ('key-invalid-long','{"action":"'+('x'*41)+'","amount":1}'),
    ('key-invalid-duplicate','{"action":"reserve","amount":1,"extra":null}'),
]
for key,payload in invalid:
    result=run("f6b21_a",op(key,payload),False)
    if "invalid synthetic payload" not in result.stderr:
        raise AssertionError(("unexpected validation failure",key,result.stderr))
# An invalid request must not reserve the operation key.
expect("f6b21_a",op("key-invalid-null",A),"NEW_SYNTHETIC")
# Repeated same operation in the other tenant remains independent.
expect("f6b21_b",op("key-invalid-null",A),"NEW_SYNTHETIC")
# No direct schema mutation, RLS bypass or unauthorized function invocation.
denied("f6b21_a","UPDATE f6b21_synthetic.operations SET operation_key='tampered';")
denied("f6b21_a","TRUNCATE f6b21_synthetic.operations;")
denied("f6b21_stranger",op("key-stranger",A))
print("PASS F6-B21/B22 identity, adversarial canonicalization, tenant isolation, concurrency, rollback, ACL/RLS")
