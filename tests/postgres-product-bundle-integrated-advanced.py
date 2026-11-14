#!/usr/bin/env python3
"""Disposable PG16: active-session REVOKE, supplier/warehouse races, durable replay."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
BASE="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
FN="ed_integrated_lab.commit_bundle(text,text,text,text[],text,bigint)"
Q="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def admin():
 return psycopg.connect(BASE+" user=postgres password=postgres")
def client(t="a"):
 return psycopg.connect(BASE+f" user=ed_integrated_{t} password=synthetic-{t}")
def invoke(c,op,product,revision,warehouses=("w1","w2")):
 return c.execute(Q,(op,product,"s",list(warehouses),"proveedor",revision)).fetchone()[0]
def revision(t="a"):
 with admin() as c:
  return c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant=%s",(t,)).fetchone()[0]
# This test follows the integrated and adversarial tests in the same disposable DB.
assert revision("a")==6 and revision("b")==3
with client() as session:
 assert session.execute("SELECT session_user").fetchone()[0]=="ed_integrated_a"
 with admin() as c:
  c.execute(f"REVOKE EXECUTE ON FUNCTION {FN} FROM ed_integrated_a")
 assert session.execute(f"SELECT has_function_privilege(current_user,'{FN}','EXECUTE')").fetchone()[0] is False
 try:
  with session.transaction():
   invoke(session,"revoked","revoked-product",6)
 except errors.InsufficientPrivilege:
  pass
 else:
  raise AssertionError("Active session unexpectedly retained EXECUTE after REVOKE")
 with admin() as c:
  c.execute(f"GRANT EXECUTE ON FUNCTION {FN} TO ed_integrated_a")
 assert invoke(session,"restored","restored-product",6)["status"]=="draft"
 assert session.execute("SELECT session_user").fetchone()[0]=="ed_integrated_a"
print("PASS active-session REVOKE blocks new RPC statements, GRANT restores access")
# Force a supplier deactivation to commit before RPC obtains tenant version lock.
with admin() as a:
 a.execute("UPDATE ed_integrated_lab.suppliers SET active=false WHERE tenant='a' AND id='s'")
with client() as c:
 assert invoke(c,"inactive-supplier","no-supplier",7)["status"]=="invalid_origin"
with admin() as c:
 c.execute("UPDATE ed_integrated_lab.suppliers SET active=true WHERE tenant='a' AND id='s'")
with admin() as c:
 c.execute("UPDATE ed_integrated_lab.warehouses SET active=false WHERE tenant='a' AND id='w2'")
with client() as c:
 assert invoke(c,"inactive-warehouse","no-warehouse",7)["status"]=="invalid_origin"
with admin() as c:
 c.execute("UPDATE ed_integrated_lab.warehouses SET active=true WHERE tenant='a' AND id='w2'")
print("PASS committed supplier/warehouse deactivation rejects new draft")
# Race: hold warehouse row lock, begin RPC, then release with warehouse inactive.
ready=threading.Event()
def waiting_rpc():
 with client() as c:
  ready.set()
  return invoke(c,"warehouse-race","warehouse-race-product",7)
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 with admin() as lock:
  lock.execute("UPDATE ed_integrated_lab.warehouses SET active=false WHERE tenant='a' AND id='w2'")
  f=pool.submit(waiting_rpc)
  assert ready.wait(5)
  time.sleep(.25)
  lock.commit()
 assert f.result(timeout=10)["status"]=="invalid_origin"
with admin() as c:
 c.execute("UPDATE ed_integrated_lab.warehouses SET active=true WHERE tenant='a' AND id='w2'")
print("PASS concurrent warehouse state change rejects stale draft")
# Durable commit followed by deliberately discarded application response.
with client() as c:
 first=invoke(c,"durable-response-lost","durable-product",7)
 assert first["status"]=="draft"
 c.commit()
 # Application intentionally ignores first response, reconnects with same operation key.
with client() as c:
 replay=invoke(c,"durable-response-lost","durable-product",7)
 assert replay["replayed"] is True and replay["revision"]==8
 assert invoke(c,"durable-response-lost","changed-product",8)["status"]=="idempotency_conflict"
with admin() as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id='durable-product'").fetchone()[0]==1
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.operations WHERE tenant='a' AND op='durable-response-lost'").fetchone()[0]==1
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
 assert revision("a")==8
print("PASS durable COMMIT with deliberately lost application response, replay exactly once")
print("PASS advanced synthetic privilege and state laboratory")
