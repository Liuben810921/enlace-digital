#!/usr/bin/env python3
"""Integrated multi-tenant supplier/warehouse/product synthetic PostgreSQL tests."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
BASE="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
SQL="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def conn(tenant):
 return psycopg.connect(BASE+f" user=ed_integrated_{tenant} password=synthetic-{tenant}")
def call(tenant,op,product,warehouses,rev,supplier="s",kind="proveedor"):
 with conn(tenant) as c:
  return c.execute(SQL,(op,product,supplier,warehouses,kind,rev)).fetchone()[0]
for tenant in ("a","b"):
 with conn(tenant) as c:
  assert c.execute("SELECT session_user").fetchone()[0]=="ed_integrated_"+tenant
  for table,priv in [("products","SELECT"),("products","INSERT"),("warehouses","SELECT"),("suppliers","SELECT"),("versions","UPDATE"),("operations","SELECT")]:
   assert c.execute("SELECT has_table_privilege(current_user,%s,%s)",("ed_integrated_lab."+table,priv)).fetchone()[0] is False
  assert c.execute("SELECT has_function_privilege(current_user,'ed_integrated_lab.commit_bundle(text,text,text,text[],text,bigint)','EXECUTE')").fetchone()[0]
with psycopg.connect(BASE+" user=postgres password=postgres") as c:
 assert c.execute("SELECT rolbypassrls FROM pg_roles WHERE rolname='ed_integrated_owner'").fetchone()[0] is False
 assert c.execute("SELECT count(*) FROM pg_class WHERE relnamespace='ed_integrated_lab'::regnamespace AND relkind='r' AND relforcerowsecurity").fetchone()[0]==7
print("PASS FORCE RLS and minimum privileges on integrated tables")
assert call("a","a1","p1",["w2","w1"],0)["status"]=="draft"
assert call("b","a1","p1",["w1","w2"],0)["status"]=="draft"
assert call("a","a1","p1",["w1","w2"],0)["replayed"] is True
assert call("b","a1","other",["w1"],1)["status"]=="idempotency_conflict"
assert call("a","stale","stale",["w1"],0)["status"]=="stale_revision"
assert call("a","wrong-supplier","p2",["foreign-supplier"],1,supplier="s")["status"]=="invalid_origin"
assert call("a","inactive","p2",["inactive"],1)["status"]=="invalid_origin"
assert call("a","cross-warehouse","p2",["w1","b-only"],1)["status"]=="invalid_origin"
assert call("a","cross-supplier","p2",["w1"],1,supplier="off")["status"]=="invalid_origin"
assert call("a","duplicate","p2",["w1","w1"],1)["status"]=="invalid"
assert call("a","existing","p1",["w1"],1)["status"]=="product_conflict"
with psycopg.connect(BASE+" user=postgres password=postgres") as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published").fetchone()[0]==0
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.product_warehouses").fetchone()[0]==4
print("PASS cross-tenant ownership, active supplier, multiwarehouse, draft and idempotency")
with conn("a") as c:
 assert c.execute(SQL,("rollback","rollback-p","s",["w1","w2"],"proveedor",1)).fetchone()[0]["status"]=="draft"
 c.rollback()
assert call("a","rollback","rollback-p",["w2","w1"],1)["status"]=="draft"
print("PASS rollback of product, links, revision and operation")
ready=threading.Event()
def contender():
 with conn("a") as c:
  ready.set()
  result=c.execute(SQL,("race","other-p","s",["w2"],"proveedor",2)).fetchone()[0]
  c.commit()
  return result
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 with conn("a") as c:
  assert c.execute(SQL,("race","winner-p","s",["w1","w2"],"proveedor",2)).fetchone()[0]["status"]=="draft"
  future=pool.submit(contender)
  assert ready.wait(5)
  time.sleep(.15)
  assert not future.done()
  c.commit()
 assert future.result(timeout=10)["status"]=="idempotency_conflict"
assert call("a","race","winner-p",["w2","w1"],2)["replayed"] is True
assert call("a","stale-race","new-p",["w1"],2)["status"]=="stale_revision"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 fa=pool.submit(call,"a","parallel-a","pa",["w1","w2"],3)
 fb=pool.submit(call,"b","parallel-b","pb",["w1","w2"],1)
 assert fa.result(timeout=10)["status"]=="draft"
 assert fb.result(timeout=10)["status"]=="draft"
with psycopg.connect(BASE+" user=postgres password=postgres") as c:
 assert c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0]==4
 assert c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='b'").fetchone()[0]==2
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products").fetchone()[0]==6
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
print("PASS concurrent same-tenant CAS and cross-tenant independent commits")
print("PASS integrated synthetic multi-tenant product-supplier-warehouse laboratory")
