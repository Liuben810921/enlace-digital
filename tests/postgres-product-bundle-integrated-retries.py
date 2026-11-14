#!/usr/bin/env python3
"""Disposable PG16 bounded retries: real 40P01 and 40001, jitter, rollback and replay."""
import concurrent.futures
import random
import threading
import time
import psycopg
from psycopg import errors

DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
CLIENT="host=127.0.0.1 port=5432 dbname=postgres user=ed_integrated_a password=synthetic-a connect_timeout=5"
RPC="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
RETRYABLE={"40P01","40001"}
MAX_ATTEMPTS=3
def retry_transaction(dsn,work,stats,delay=.01):
 for attempt in range(1,MAX_ATTEMPTS+1):
  try:
   with psycopg.connect(dsn) as conn:
    return work(conn,attempt)
  except psycopg.Error as exc:
   if exc.sqlstate not in RETRYABLE:
    raise
   stats.append((attempt,exc.sqlstate))
   if attempt==MAX_ATTEMPTS:
    raise
   time.sleep(min(.12,delay*2**(attempt-1))+random.Random(attempt).uniform(0,.006))
 raise AssertionError("unreachable")

def rev():
 with psycopg.connect(DSN) as c:
  return c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0]
assert rev()==9

# Actual 40P01: first attempts lock opposite warehouse rows; retry uses canonical order.
barrier=threading.Barrier(2)
def worker(first,second):
 stats=[]
 def work(c,attempt):
  c.execute("SET deadlock_timeout='100ms'")
  c.execute("SET lock_timeout='5s'")
  order=(first,second) if attempt==1 else ("w1","w2")
  c.execute("UPDATE ed_integrated_lab.warehouses SET active=active WHERE tenant='a' AND id=%s",(order[0],))
  if attempt==1:
   barrier.wait(timeout=5)
  c.execute("UPDATE ed_integrated_lab.warehouses SET active=active WHERE tenant='a' AND id=%s",(order[1],))
  return attempt
 result=retry_transaction(DSN,work,stats)
 return result,stats
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 f1=pool.submit(worker,"w1","w2")
 f2=pool.submit(worker,"w2","w1")
 out=[f1.result(timeout=15),f2.result(timeout=15)]
assert sorted(x[0] for x in out)==[1,2],out
assert sorted(x[1][0][1] for x in out if x[1])==["40P01"],out
print("PASS real 40P01 bounded automatic retry, canonical lock order, exponential backoff+jitter")

# Actual 40001: both SERIALIZABLE transactions read same row before either commits.
barrier=threading.Barrier(2)
def serial_worker():
 stats=[]
 def work(c,attempt):
  c.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
  c.execute("SET lock_timeout='5s'")
  current=c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='b'").fetchone()[0]
  if attempt==1:
   barrier.wait(timeout=5)
  c.execute("UPDATE ed_integrated_lab.versions SET revision=%s WHERE tenant='b'",(current+1,))
  return attempt
 result=retry_transaction(DSN,work,stats)
 return result,stats
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 f1=pool.submit(serial_worker)
 f2=pool.submit(serial_worker)
 out=[f1.result(timeout=15),f2.result(timeout=15)]
assert sorted(x[0] for x in out)==[1,2],out
assert sorted(x[1][0][1] for x in out if x[1])==["40001"],out
with psycopg.connect(DSN) as c:
 assert c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='b'").fetchone()[0]==5
print("PASS real 40001 SERIALIZABLE concurrent write, bounded automatic retry")

# Deterministic exhaustion: injectable genuine PostgreSQL 40001, no mutation committed.
attempts=[]
def exhausted(c,attempt):
 attempts.append(attempt)
 c.execute("DO $$ BEGIN RAISE EXCEPTION 'synthetic retry exhaustion' USING ERRCODE='40001'; END $$")
try:
 retry_transaction(DSN,exhausted,[],delay=.001)
except errors.SerializationFailure:
 pass
else:
 raise AssertionError("retry exhaustion did not propagate")
assert attempts==[1,2,3]
print("PASS bounded retry exhaustion at 3 attempts; no infinite loop")

# RPC: forced rollback then automatic re-execution with identical operation key.
before=rev()
assert before==9
rpc_stats=[]
def rpc_work(c,attempt):
 response=c.execute(RPC,("auto-retry-op","auto-retry-product","s",["w1","w2"],"proveedor",before)).fetchone()[0]
 if attempt==1:
  c.execute("DO $$ BEGIN RAISE EXCEPTION 'synthetic serialization retry' USING ERRCODE='40001'; END $$")
 return response
result=retry_transaction(CLIENT,rpc_work,rpc_stats)
assert result["status"]=="draft" and result["revision"]==10
assert rpc_stats==[(1,"40001")]
with psycopg.connect(CLIENT) as c:
 replay=c.execute(RPC,("auto-retry-op","auto-retry-product","s",["w2","w1"],"proveedor",before)).fetchone()[0]
 assert replay["replayed"] is True and replay["revision"]==10
 conflict=c.execute(RPC,("auto-retry-op","different-product","s",["w1","w2"],"proveedor",10)).fetchone()[0]
 assert conflict["status"]=="idempotency_conflict"
with psycopg.connect(DSN) as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id='auto-retry-product'").fetchone()[0]==1
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.operations WHERE tenant='a' AND op='auto-retry-op'").fetchone()[0]==1
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
 assert c.execute("SELECT rolbypassrls FROM pg_roles WHERE rolname='ed_integrated_owner'").fetchone()[0] is False
 assert c.execute("SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='ed_integrated_lab'::regnamespace AND relkind='r'").fetchone()[0] is True
assert rev()==10
print("PASS rollback before automatic RPC retry, one draft and operation, replay and payload conflict")
print("PASS FORCE RLS, non-BYPASSRLS technical owner, no published products")
