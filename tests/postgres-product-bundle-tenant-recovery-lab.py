#!/usr/bin/env python3
"""Disposable PostgreSQL authenticated tenant isolation and real COMMIT interruption."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import OperationalError
BASE="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
SQL="SELECT ed_tenant_lab.commit_multi(%s,%s,%s,%s)"
def tenant(who):
 return psycopg.connect(BASE+f" user=ed_tenant_{who} password=synthetic-{who}")
def call(who,op,product,warehouses,revision):
 with tenant(who) as c:
  return c.execute(SQL,(op,product,warehouses,revision)).fetchone()[0]
for who in ("a","b"):
 with tenant(who) as c:
  assert c.execute("SELECT session_user").fetchone()[0]=="ed_tenant_"+who
  assert c.execute("SELECT has_table_privilege(current_user,'ed_tenant_lab.records','SELECT')").fetchone()[0] is False
  assert c.execute("SELECT has_table_privilege(current_user,'ed_tenant_lab.records','INSERT')").fetchone()[0] is False
  assert c.execute("SELECT has_table_privilege(current_user,'ed_tenant_lab.versions','UPDATE')").fetchone()[0] is False
assert call("a","shared","same",["w1","w2"],0)["tenant"]=="a"
assert call("b","shared","same",["w2","w1"],0)["tenant"]=="b"
assert call("a","shared","same",["w2","w1"],0)["replayed"] is True
assert call("b","shared","different",["w1"],1)["status"]=="idempotency_conflict"
assert call("a","stale","different",["w1"],0)["status"]=="stale_revision"
with psycopg.connect(BASE+" user=postgres password=postgres") as c:
 assert c.execute("SELECT count(*) FROM ed_tenant_lab.records").fetchone()[0]==2
 assert c.execute("SELECT count(*) FROM ed_tenant_lab.ops").fetchone()[0]==2
 assert c.execute("SELECT count(*) FROM ed_tenant_lab.records WHERE published").fetchone()[0]==0
print("PASS authenticated two-tenant isolation, independent revisions and idempotency")
# Real independent tenant commits with same expected version succeed concurrently.
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 fa=pool.submit(call,"a","next","p-a",["w1","w2"],1)
 fb=pool.submit(call,"b","next","p-b",["w1","w2"],1)
 assert fa.result(timeout=10)["status"]=="draft"
 assert fb.result(timeout=10)["status"]=="draft"
print("PASS simultaneous multiwarehouse commits isolated by tenant")
# Deferred trigger executes at COMMIT, so termination is genuinely inside commit processing.
with psycopg.connect(BASE+" user=postgres password=postgres") as admin:
 admin.execute("""
 CREATE FUNCTION ed_bundle_lab.delay_commit() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN
  IF NEW.op='interrupt-real' THEN PERFORM pg_sleep(3); END IF;
  RETURN NULL;
 END $$;
 """)
 admin.execute("""
 CREATE CONSTRAINT TRIGGER deferred_commit_delay
 AFTER INSERT ON ed_bundle_lab.operations DEFERRABLE INITIALLY DEFERRED
 FOR EACH ROW EXECUTE FUNCTION ed_bundle_lab.delay_commit();
 """)
 admin.commit()
started=threading.Event()
pidbox={}
def interrupted_writer():
 c=psycopg.connect(BASE+" user=postgres password=postgres")
 try:
  c.execute("SET ROLE ed_bundle_client")
  pidbox["pid"]=c.execute("SELECT pg_backend_pid()").fetchone()[0]
  result=c.execute("SELECT ed_bundle_lab.commit_multi(%s,%s,%s,%s,%s,%s)",("interrupt-real","interrupt-product","s1",["w1","w2"],"proveedor",4)).fetchone()[0]
  assert result["status"]=="draft"
  started.set()
  try:
   c.commit()
   return "committed"
  except (OperationalError,psycopg.Error):
   return "connection_lost"
 finally:
  c.close()
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 future=pool.submit(interrupted_writer)
 assert started.wait(8)
 time.sleep(.35)
 with psycopg.connect(BASE+" user=postgres password=postgres",autocommit=True) as admin:
  assert admin.execute("SELECT pg_terminate_backend(%s)",(pidbox["pid"],)).fetchone()[0] is True
 outcome=future.result(timeout=12)
with psycopg.connect(BASE+" user=postgres password=postgres") as admin:
 rows=admin.execute("SELECT count(*) FROM ed_bundle_lab.operations WHERE op='interrupt-real'").fetchone()[0]
 revision=admin.execute("SELECT revision FROM ed_bundle_lab.context WHERE id=1").fetchone()[0]
 assert rows in (0,1)
 assert revision==rows
 assert admin.execute("SELECT count(*) FROM ed_bundle_lab.products WHERE id='interrupt-product'").fetchone()[0]==rows
 assert admin.execute("SELECT count(*) FROM ed_bundle_lab.product_warehouses WHERE product_id='interrupt-product'").fetchone()[0]==rows*2
print("PASS actual connection termination during deferred COMMIT; atomic outcome",outcome,rows)
with psycopg.connect(BASE+" user=postgres password=postgres") as admin:
 admin.execute("DROP TRIGGER deferred_commit_delay ON ed_bundle_lab.operations")
 admin.commit()
with psycopg.connect(BASE+" user=postgres password=postgres") as c:
 c.execute("SET ROLE ed_bundle_client")
 result=c.execute("SELECT ed_bundle_lab.commit_multi(%s,%s,%s,%s,%s,%s)",("interrupt-real","interrupt-product","s1",["w2","w1"],"proveedor",4)).fetchone()[0]
 assert (result.get("replayed") is True) if rows else (result["status"]=="draft")
 c.commit()
print("PASS idempotent recovery from real commit interruption")
