#!/usr/bin/env python3
"""PG16 disposable: supplier races, opposite administrative locks, SQLSTATE 40P01 and retries."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
BASE="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
RPC="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def db(user="postgres"):
 if user=="postgres": return psycopg.connect(BASE+" user=postgres password=postgres")
 return psycopg.connect(BASE+f" user=ed_integrated_{user} password=synthetic-{user}")
def call(c,op,product,rev):
 return c.execute(RPC,(op,product,"s",["w1","w2"],"proveedor",rev)).fetchone()[0]
def check():
 with db() as c:
  a=c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0]
  assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
  return a
assert check()==8
# A supplier UPDATE in progress must be observed by the RPC after FOR SHARE waits.
ready=threading.Event()
def supplier_rpc():
 with db("a") as c:
  ready.set()
  return call(c,"supplier-race","supplier-race-product",8)
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 with db() as a:
  a.execute("UPDATE ed_integrated_lab.suppliers SET active=false WHERE tenant='a' AND id='s'")
  f=pool.submit(supplier_rpc)
  assert ready.wait(5)
  time.sleep(.2)
  assert not f.done()
  a.commit()
 assert f.result(timeout=10)["status"]=="invalid_origin"
with db() as c:
 c.execute("UPDATE ed_integrated_lab.suppliers SET active=true WHERE tenant='a' AND id='s'")
assert check()==8
print("PASS supplier deactivation concurrent with FOR SHARE rejects stale origin, no draft")
# Opposite order administrative updates on two warehouses: force a genuine PostgreSQL deadlock.
barrier=threading.Barrier(2)
def reverse_locks(first,second):
 try:
  with db() as c:
   c.execute("SET deadlock_timeout='100ms'")
   c.execute("SET lock_timeout='5s'")
   c.execute("UPDATE ed_integrated_lab.warehouses SET active=active WHERE tenant='a' AND id=%s",(first,))
   barrier.wait(timeout=5)
   c.execute("UPDATE ed_integrated_lab.warehouses SET active=active WHERE tenant='a' AND id=%s",(second,))
   c.commit()
  return "committed"
 except errors.DeadlockDetected as e:
  assert e.sqlstate=="40P01"
  return "40P01"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 f1=pool.submit(reverse_locks,"w1","w2")
 f2=pool.submit(reverse_locks,"w2","w1")
 outcomes=[f1.result(timeout=12),f2.result(timeout=12)]
assert sorted(outcomes)==["40P01","committed"],outcomes
print("PASS opposite administrative row-lock order yields one PostgreSQL 40P01 victim")
# Retrying the aborted admin transaction after backoff is safe and does not change active state.
with db() as c:
 c.execute("SET lock_timeout='5s'")
 c.execute("UPDATE ed_integrated_lab.warehouses SET active=active WHERE tenant='a' AND id='w1'")
 c.execute("UPDATE ed_integrated_lab.warehouses SET active=active WHERE tenant='a' AND id='w2'")
assert check()==8
# A failed/rolled-back client transaction must not persist operation or product.
with db("a") as c:
 assert call(c,"retry-after-rollback","retry-product",8)["status"]=="draft"
 c.rollback()
with db("a") as c:
 result=call(c,"retry-after-rollback","retry-product",8)
 assert result["status"]=="draft" and result["revision"]==9
with db("a") as c:
 assert call(c,"retry-after-rollback","retry-product",8)["replayed"] is True
 assert call(c,"retry-after-rollback","changed",9)["status"]=="idempotency_conflict"
with db() as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id='retry-product'").fetchone()[0]==1
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.operations WHERE tenant='a' AND op='retry-after-rollback'").fetchone()[0]==1
assert check()==9
print("PASS deadlock-victim administrative retry, RPC rollback retry, idempotent replay, drafts unpublished")
