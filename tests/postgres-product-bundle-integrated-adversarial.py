#!/usr/bin/env python3
"""Adversarial identity, RLS, FK and CAS tests in disposable PostgreSQL only."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
BASE="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
RPC="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def client(t):
 return psycopg.connect(BASE+f" user=ed_integrated_{t} password=synthetic-{t}")
def admin():
 return psycopg.connect(BASE+" user=postgres password=postgres")
def denied(c,query,params=None):
 try:
  with c.transaction():
   c.execute(query,params)
 except errors.InsufficientPrivilege:
  return
 raise AssertionError("Expected permission denied: "+query)
for tenant in ("a","b"):
 with client(tenant) as c:
  assert c.execute("SELECT session_user").fetchone()[0]=="ed_integrated_"+tenant
  denied(c,"SELECT * FROM ed_integrated_lab.identities")
  denied(c,"SELECT * FROM ed_integrated_lab.products")
  denied(c,"UPDATE ed_integrated_lab.versions SET revision=0")
  denied(c,"INSERT INTO ed_integrated_lab.products(tenant,id,kind,primary_warehouse) VALUES('a','forged','proveedor','w1')")
  denied(c,"SET ROLE ed_integrated_owner")
  denied(c,"SET ROLE ed_integrated_"+("b" if tenant=="a" else "a"))
  c.execute("SELECT set_config('app.tenant','b',false)")
  assert c.execute(RPC,("spoof-"+tenant,"spoof-product-"+tenant,"s",["w1"],"proveedor",4 if tenant=="a" else 2)).fetchone()[0]["tenant"]==tenant
print("PASS identity spoofing denied, untrusted session variable ignored, client table privileges denied")
# Explicitly exercise FORCE RLS inside SECURITY DEFINER: create test-only read probe owned by same technical role.
with admin() as c:
 c.execute("""CREATE FUNCTION ed_integrated_lab.probe_tenants()
 RETURNS TABLE(tenant text, products bigint) LANGUAGE sql SECURITY DEFINER
 SET search_path=pg_catalog,ed_integrated_lab AS $$
 SELECT p.tenant,count(*) FROM ed_integrated_lab.products p GROUP BY p.tenant
 $$""")
 c.execute("ALTER FUNCTION ed_integrated_lab.probe_tenants() OWNER TO ed_integrated_owner")
 c.execute("REVOKE ALL ON FUNCTION ed_integrated_lab.probe_tenants() FROM PUBLIC")
 c.execute("GRANT EXECUTE ON FUNCTION ed_integrated_lab.probe_tenants() TO ed_integrated_a,ed_integrated_b")
with client("a") as c:
 assert c.execute("SELECT * FROM ed_integrated_lab.probe_tenants()").fetchall()==[("a",5)]
with client("b") as c:
 assert c.execute("SELECT * FROM ed_integrated_lab.probe_tenants()").fetchall()==[("b",3)]
print("PASS FORCE RLS filters actual rows inside technical SECURITY DEFINER function")
# Direct FK attacks use privileged test harness, never operational roles.
with admin() as c:
 c.execute("INSERT INTO ed_integrated_lab.suppliers VALUES(%s,%s,true)",("b","b-only"))
 c.execute("INSERT INTO ed_integrated_lab.warehouses VALUES(%s,%s,%s,%s,true)",("b","b-only","b-only","proveedor"))
def fk_violation(sql,params):
 with admin() as c:
  try:
   with c.transaction():
    c.execute(sql,params)
  except errors.ForeignKeyViolation:
   return
 raise AssertionError("Expected composite foreign-key rejection")
fk_violation("INSERT INTO ed_integrated_lab.warehouses(tenant,id,supplier_id,kind,active) VALUES(%s,%s,%s,'proveedor',true)",("a","fk-cross-supplier","b-only"))
fk_violation("INSERT INTO ed_integrated_lab.products(tenant,id,supplier_id,kind,primary_warehouse) VALUES(%s,%s,%s,'proveedor',%s)",("a","fk-cross-product","s","b-only"))
fk_violation("INSERT INTO ed_integrated_lab.product_warehouses(tenant,product_id,warehouse_id) VALUES(%s,%s,%s)",("a","p1","b-only"))
fk_violation("INSERT INTO ed_integrated_lab.product_warehouses(tenant,product_id,warehouse_id) VALUES(%s,%s,%s)",("b","pa","w1"))
print("PASS composite foreign keys reject cross-company supplier, product and warehouse references")
# Same-tenant concurrent stale CAS: only one operation may win.
ready=threading.Event()
def loser():
 with client("a") as c:
  ready.set()
  r=c.execute(RPC,("adversarial-loser","adversarial-loser-p","s",["w2"],"proveedor",5)).fetchone()[0]
  c.commit()
  return r
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 with client("a") as c:
  assert c.execute(RPC,("adversarial-winner","adversarial-winner-p","s",["w1","w2"],"proveedor",5)).fetchone()[0]["status"]=="draft"
  f=pool.submit(loser)
  assert ready.wait(5)
  time.sleep(.15)
  assert not f.done()
  c.commit()
 assert f.result(timeout=10)["status"]=="stale_revision"
with client("a") as c:
 assert c.execute(RPC,("adversarial-winner","adversarial-winner-p","s",["w2","w1"],"proveedor",5)).fetchone()[0]["replayed"] is True
 assert c.execute(RPC,("adversarial-winner","different","s",["w1","w2"],"proveedor",6)).fetchone()[0]["status"]=="idempotency_conflict"
with admin() as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
 assert c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0]==6
 assert c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='b'").fetchone()[0]==3
print("PASS concurrent CAS winner, stale loser, replay and idempotency conflict; all drafts unpublished")
