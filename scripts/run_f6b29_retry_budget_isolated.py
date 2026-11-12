#!/usr/bin/env python3
"""F6-B29 synthetic retry policy: deterministic bounded delays and PG isolation."""
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256

# Fail closed: never retry permissions, payload conflicts, cancellations or
# unknown errors. 55P03 is retryable only when an explicit lock budget exists.
RETRYABLE=frozenset(("40P01","40001","55P03"))
NONRETRYABLE=frozenset(("23505","23514","22023","42501","57014","P0001","08006"))
MAX_ATTEMPTS=3
MAX_DELAY_MS=350
BASE_MS=40
CAP_MS=160

def classify(code):
    if not isinstance(code,str) or len(code)!=5:
        return "stop"
    return "retry" if code in RETRYABLE else "stop"

def delay_ms(operation,attempt):
    """Deterministic jitter: integer arithmetic, no real sleeping."""
    assert isinstance(operation,str) and operation.isascii() and operation
    assert 1<=attempt<MAX_ATTEMPTS
    exponential=min(CAP_MS,BASE_MS*(2**(attempt-1)))
    digest=sha256((operation+"|"+str(attempt)).encode("ascii")).digest()
    jitter=int.from_bytes(digest[:2],"big")%(exponential//2+1)
    return exponential//2+jitter

def simulate(operation,outcomes,limit=MAX_DELAY_MS,cancel_at=None):
    """Return attempts, cumulative delay and final outcome; no side effects."""
    assert 0<=limit<=MAX_DELAY_MS
    used=0
    for index,outcome in enumerate(outcomes,1):
        if index>MAX_ATTEMPTS: return index-1,used,"budget-attempts"
        if cancel_at is not None and index>=cancel_at:
            return index-1,used,"cancelled"
        if outcome=="OK": return index,used,"OK"
        if classify(outcome)!="retry": return index,used,"stop:"+str(outcome)
        if index==MAX_ATTEMPTS: return index,used,"budget-attempts"
        delay=delay_ms(operation,index)
        if used+delay>limit: return index,used,"budget-delay"
        used+=delay
    return len(outcomes),used,"incomplete"

assert all(classify(code)=="retry" for code in RETRYABLE)
assert all(classify(code)=="stop" for code in NONRETRYABLE)
assert classify("XX000")=="stop" and classify(None)=="stop"
assert classify("40P0")=="stop" and classify("40P01extra")=="stop"
assert all(delay_ms("b29",i)==delay_ms("b29",i) for i in (1,2))
assert 20<=delay_ms("b29",1)<=40
assert 40<=delay_ms("b29",2)<=80
assert sum(delay_ms("b29",i) for i in (1,2))<=MAX_DELAY_MS
assert simulate("b29",["40P01","40001","OK"])[2]=="OK"
assert simulate("b29",["55P03","55P03","55P03","OK"])[2]=="budget-attempts"
assert simulate("b29",["40P01","OK"],limit=0)==(1,0,"budget-delay")
assert simulate("b29",["40P01","OK"],cancel_at=2)[2]=="cancelled"
assert simulate("b29",["42501","OK"])[0:3]==(1,0,"stop:42501")
assert simulate("b29",["57014","OK"])[2]=="stop:57014"
assert simulate("b29",["23505","OK"])[2]=="stop:23505"
assert simulate("b29",["P0001","OK"])[2]=="stop:P0001"
assert simulate("b29",["08006","OK"])[2]=="stop:08006"
# Jitter differs by operation but never crosses the fixed cap.
assert len({(delay_ms("b29-"+str(i),1),delay_ms("b29-"+str(i),2)) for i in range(12)})>1
assert simulate("b29",["40P01","40001","OK"],limit=50)[2]=="budget-delay"

source=open("scripts/run_f6b24_raw_json_contract_isolated.py",encoding="utf8").read().split("GOOD=b",1)[0]
scope={}
exec(compile(source,"f6b24_parser_only","exec"),scope)
strict=scope["strict"]
RAW=b'{"version":"ED-OP-v1","action":"reserve","currency":"USD","amount_minor":12345}'
ALT=b' { "amount_minor":12345, "currency":"USD", "action":"reserve", "version":"ED-OP-v1" } '
CHANGED=RAW.replace(b"12345",b"12346")
assert strict(RAW)==strict(ALT)

def execute(role,statement,timeout=15):
    env={**os.environ,"PGUSER":"f6b23_"+role,"PGPASSWORD":"synthetic_b23_"+role}
    return subprocess.run(["psql","-X","-A","-t","-v","ON_ERROR_STOP=1",
                           "-v","VERBOSITY=verbose","-c",statement],
                          env=env,text=True,capture_output=True,timeout=timeout)
def reserve(role,key,payload):
    q="SELECT f6b23_synthetic.reserve('"+key+"','"+strict(payload)+"'::jsonb);"
    r=execute(role,q)
    assert r.returncode==0,(r.stdout,r.stderr)
    return r.stdout.strip()

# Two synthetic identities, same operation key; no cross-tenant collision.
def attempt(pair):
    role,i=pair
    payload=ALT if role=="a" and i%2 else RAW if role=="a" else CHANGED
    return role,reserve(role,"key-b29-race",payload)
with ThreadPoolExecutor(max_workers=8) as pool:
    outcomes=list(pool.map(attempt,[(role,i) for role in ("a","b") for i in range(8)]))
for role in ("a","b"):
    results=[value for who,value in outcomes if who==role]
    assert results.count("NEW")==1 and results.count("REPLAY")==7,(role,results)
assert reserve("a","key-b29-race",CHANGED)=="CONFLICT"
assert reserve("b","key-b29-race",RAW)=="CONFLICT"
assert reserve("a","key-b29-race",ALT)=="REPLAY"

# A failed transaction cannot reserve a key; retry policy does not bypass DB ACL.
query="BEGIN; SELECT f6b23_synthetic.reserve('key-b29-abort','"+strict(RAW)+"'::jsonb); SELECT 1/0; COMMIT;"
failed=execute("a",query)
assert failed.returncode!=0 and "22012" in failed.stderr,failed.stderr
assert reserve("a","key-b29-abort",RAW)=="NEW"
assert reserve("a","key-b29-abort",ALT)=="REPLAY"
for role in ("a","b","stranger"):
    for query in ("SELECT * FROM f6b23_synthetic.operations;",
                  "UPDATE f6b23_synthetic.operations SET operation_key='forged';",
                  "SET ROLE f6b23_owner;"):
        r=execute(role,query)
        assert r.returncode!=0 and "permission denied" in r.stderr,(role,r.stderr)
denied=execute("stranger","SELECT f6b23_synthetic.reserve('key-b29-stranger','"+strict(RAW)+"'::jsonb);")
assert denied.returncode!=0 and "permission denied" in denied.stderr
print("PASS F6-B29 bounded deterministic jitter, SQLSTATE classification, cancellation, retry identity and ACL")
