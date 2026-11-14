#!/usr/bin/env python3
"""Disposable PostgreSQL 16: actual backend termination inside deferred COMMIT and SQL deadlines."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
ADMIN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
CLIENT="host=127.0.0.1 port=5432 dbname=postgres user=ed_integrated_a password=synthetic-a connect_timeout=5"
RPC="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def rpc(c,key,product,rev):
 return c.execute(RPC,(key,product,"s",["w1","w2"],"proveedor",rev)).fetchone()[0]
def snapshot(key,product):
 with psycopg.connect(ADMIN) as c:
  return (c.execute("SELECT count(*) FROM ed_integrated_lab.operations WHERE tenant='a' AND op=%s",(key,)).fetchone()[0],
          c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id=%s",(product,)).fetchone()[0],
          c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0])
assert snapshot("during-commit","during-commit-product")== (0,0,12)
# The trigger runs at COMMIT, not during the RPC. A separate privileged disposable
# connection terminates the actual backend while pg_sleep is running.
with psycopg.connect(ADMIN) as c:
 c.execute("""CREATE FUNCTION ed_integrated_lab.pause_during_commit() RETURNS trigger
 LANGUAGE plpgsql AS $$ BEGIN IF NEW.op='during-commit' THEN PERFORM pg_sleep(3); END IF; RETURN NULL; END $$""")
 c.execute("""CREATE CONSTRAINT TRIGGER pause_during_commit
 AFTER INSERT ON ed_integrated_lab.operations DEFERRABLE INITIALLY DEFERRED
 FOR EACH ROW EXECUTE FUNCTION ed_integrated_lab.pause_during_commit()""")
 c.commit()
ready=threading.Event()
pid={}
def writer():
 c=psycopg.connect(CLIENT)
 try:
  pid["value"]=c.execute("SELECT pg_backend_pid()").fetchone()[0]
  assert rpc(c,"during-commit","during-commit-product",12)["status"]=="draft"
  ready.set()
  try:
   c.commit()
   return "committed"
  except (psycopg.OperationalError,psycopg.InterfaceError):
   return "connection_lost"
 finally:
  c.close()
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
 f=pool.submit(writer)
 assert ready.wait(8)
 # Confirm the backend is executing the deferred trigger, not merely sleeping before COMMIT.
 found=False
 with psycopg.connect(ADMIN) as a:
  for _ in range(30):
   state=a.execute("SELECT query,wait_event FROM pg_stat_activity WHERE pid=%s",(pid["value"],)).fetchone()
   if state and state[0].strip().upper()=="COMMIT" and state[1]=="PgSleep":
    found=True
    break
   time.sleep(.05)
  assert found,"Backend never observed in deferred COMMIT trigger"
 with psycopg.connect(ADMIN,autocommit=True) as a:
  assert a.execute("SELECT pg_terminate_backend(%s)",(pid["value"],)).fetchone()[0] is True
 outcome=f.result(timeout=12)
assert outcome=="connection_lost",outcome
ops,products,revision=snapshot("during-commit","during-commit-product")
assert ops==products and ops in (0,1) and revision==12+ops
print("PASS real backend termination inside deferred COMMIT, atomic outcome",outcome,ops)
with psycopg.connect(ADMIN) as a:
 a.execute("DROP TRIGGER pause_during_commit ON ed_integrated_lab.operations")
 a.execute("DROP FUNCTION ed_integrated_lab.pause_during_commit()")
with psycopg.connect(CLIENT) as c:
 response=rpc(c,"during-commit","during-commit-product",12)
 assert response.get("replayed") is True if ops else response["status"]=="draft"
 assert response["revision"]==13
with psycopg.connect(CLIENT) as c:
 assert rpc(c,"during-commit","during-commit-product",12)["replayed"] is True
 assert rpc(c,"during-commit","changed-product",13)["status"]=="idempotency_conflict"
assert snapshot("during-commit","during-commit-product")== (1,1,13)
print("PASS unknown-result reconciliation by same operation key, one committed draft")
# Real statement_timeout and lock_timeout: a blocked tenant revision lock
# prevents the RPC from finishing; PostgreSQL cancels and rolls back.
with psycopg.connect(ADMIN) as blocker:
 blocker.execute("UPDATE ed_integrated_lab.versions SET revision=revision WHERE tenant='a'")
 with psycopg.connect(CLIENT) as victim:
  victim.execute("SET statement_timeout='300ms'")
  victim.execute("SET lock_timeout='100ms'")
  try:
   rpc(victim,"lock-timeout","no-lock-product",13)
  except errors.LockNotAvailable as exc:
   assert exc.sqlstate=="55P03"
   victim.rollback()
  else: raise AssertionError("lock_timeout was not enforced")
 blocker.rollback()
assert snapshot("lock-timeout","no-lock-product")== (0,0,13)
with psycopg.connect(CLIENT) as victim:
 victim.execute("SET statement_timeout='100ms'")
 victim.execute("SET lock_timeout='500ms'")
 try:
  victim.execute("SELECT pg_sleep(1)")
 except errors.QueryCanceled as exc:
  assert exc.sqlstate=="57014"
  victim.rollback()
 else: raise AssertionError("statement_timeout was not enforced")
print("PASS actual lock_timeout 55P03 and statement_timeout 57014, rollback without draft")
with psycopg.connect(ADMIN) as a:
 assert a.execute("SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='ed_integrated_lab'::regnamespace AND relkind='r'").fetchone()[0] is True
 assert a.execute("SELECT rolbypassrls FROM pg_roles WHERE rolname='ed_integrated_owner'").fetchone()[0] is False
 assert a.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
print("PASS FORCE RLS, SECURITY DEFINER owner NOBYPASSRLS, CAS and drafts unpublished")
