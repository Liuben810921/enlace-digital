#!/usr/bin/env python3
"""Adversarial synthetic PostgreSQL checks; only GitHub Actions disposable postgres."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
SQL="SELECT ed_bundle_lab.commit_multi(%s,%s,%s,%s,%s,%s)"
def connect(role="ed_bundle_client"):
 c=psycopg.connect(DSN,autocommit=False)
 c.execute("SET ROLE "+role)
 return c
def call(op,product,warehouses,revision,supplier="s1",kind="proveedor"):
 with connect() as c:
  result=c.execute(SQL,(op,product,supplier,warehouses,kind,revision)).fetchone()[0]
  c.commit()
  return result
def denied(query):
 with connect() as c:
  try:
   c.execute(query)
  except errors.InsufficientPrivilege:
   c.rollback()
   return True
  c.rollback()
  return False
assert denied("SELECT * FROM ed_bundle_lab.products")
assert denied("INSERT INTO ed_bundle_lab.products(id,kind,warehouse_id) VALUES('rogue','propio','own')")
assert denied("UPDATE ed_bundle_lab.context SET revision=0")
with connect("ed_bundle_owner") as c:
 assert c.execute("SELECT count(*) FROM ed_bundle_lab.suppliers").fetchone()[0]==2
 assert c.execute("SELECT relforcerowsecurity FROM pg_class WHERE oid='ed_bundle_lab.product_warehouses'::regclass").fetchone()[0] is True
 c.commit()
print("PASS client denied direct SELECT INSERT UPDATE; forced RLS effective for non-BYPASSRLS owner")
assert call("multi-a","multi-p",["w2","w1"],0)["status"]=="draft"
assert call("multi-a","multi-p",["w1","w2"],0)["replayed"] is True
assert call("multi-a","multi-p",["w1"],1)["status"]=="idempotency_conflict"
assert call("multi-invalid","invalid-p",["w1","off"],1)["status"]=="invalid_origin"
assert call("multi-duplicate","duplicate-p",["w1","w1"],1)["status"]=="invalid"
assert call("multi-product","multi-p",["w1"],1)["status"]=="product_conflict"
with psycopg.connect(DSN) as c:
 assert c.execute("SELECT count(*) FROM ed_bundle_lab.product_warehouses WHERE product_id='multi-p'").fetchone()[0]==2
 assert c.execute("SELECT published,status FROM ed_bundle_lab.products WHERE id='multi-p'").fetchone()==(False,"draft")
print("PASS multiple warehouses, canonical order, duplicates, inactive origin and draft")
with connect() as c:
 assert c.execute(SQL,("multi-rollback","rollback-p","s1",["w1","w2"],"proveedor",1)).fetchone()[0]["status"]=="draft"
 c.rollback()
assert call("multi-rollback","rollback-p",["w1","w2"],1)["status"]=="draft"
print("PASS multi-warehouse transaction rollback and retry")
# Actual concurrent contenders: same operation ID, different payload; loser waits and returns conflict.
ready=threading.Event()
def contender():
 with connect() as c:
  ready.set()
  result=c.execute(SQL,("race-op","race-other","s1",["w2"],"proveedor",2)).fetchone()[0]
  c.commit()
  return result
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 with connect() as c:
  assert c.execute(SQL,("race-op","race-first","s1",["w1"],"proveedor",2)).fetchone()[0]["status"]=="draft"
  future=pool.submit(contender)
  assert ready.wait(5)
  time.sleep(.2)
  assert not future.done()
  c.commit()
 assert future.result(timeout=10)["status"]=="idempotency_conflict"
assert call("race-retry","race-first",["w2"],3)["status"]=="product_conflict"
print("PASS concurrent operation conflict and existing product conflict")
# Lost response after durable COMMIT: close connection before caller processes the response.
c=connect()
try:
 result=c.execute(SQL,("lost-response","lost-product","s1",["w1","w2"],"proveedor",3)).fetchone()[0]
 assert result["status"]=="draft"
 c.commit()
finally:
 c.close()
assert call("lost-response","lost-product",["w2","w1"],3)["replayed"] is True
assert call("lost-response","different-payload",["w1","w2"],4)["status"]=="idempotency_conflict"
print("PASS post-commit response loss simulation, replay and payload conflict")
with psycopg.connect(DSN) as c:
 assert c.execute("SELECT revision FROM ed_bundle_lab.context WHERE id=1").fetchone()[0]==4
 assert c.execute("SELECT count(*) FROM ed_bundle_lab.product_warehouses").fetchone()[0]==8
print("PASS adversarial multi-warehouse PostgreSQL lab")
