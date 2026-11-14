#!/usr/bin/env python3
"""Disposable PG16: unknown commit outcomes, bounded deadlines, non-retryable errors."""
import time
import psycopg
from psycopg import errors
ADMIN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
CLIENT="host=127.0.0.1 port=5432 dbname=postgres user=ed_integrated_a password=synthetic-a connect_timeout=5"
RPC="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def invoke(c,key,product,expected=10):
 return c.execute(RPC,(key,product,"s",["w1","w2"],"proveedor",expected)).fetchone()[0]
def count(key):
 with psycopg.connect(ADMIN) as c:
  return c.execute("SELECT count(*) FROM ed_integrated_lab.operations WHERE tenant='a' AND op=%s",(key,)).fetchone()[0]
def revision():
 with psycopg.connect(ADMIN) as c:
  return c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0]
assert revision()==10
# Simulated response loss after confirmed durable commit: never repeat with a new key.
with psycopg.connect(CLIENT) as c:
 assert invoke(c,"unknown-committed","unknown-committed-product")["status"]=="draft"
 c.commit()
 # Application deliberately discards the RPC response after confirmed commit.
with psycopg.connect(CLIENT) as c:
 replay=invoke(c,"unknown-committed","unknown-committed-product")
 assert replay["replayed"] is True and replay["revision"]==11
assert count("unknown-committed")==1 and revision()==11
print("PASS durable commit with discarded response: same-key replay exactly once")
# Actual connection loss before COMMIT: close connection and recover with same key.
c=psycopg.connect(CLIENT)
assert invoke(c,"unknown-aborted","unknown-aborted-product",11)["status"]=="draft"
c.close() # Server rolls back open transaction.
assert count("unknown-aborted")==0 and revision()==11
with psycopg.connect(CLIENT) as c:
 assert invoke(c,"unknown-aborted","unknown-aborted-product",11)["status"]=="draft"
assert count("unknown-aborted")==1 and revision()==12
print("PASS connection termination before COMMIT rolls back; same-key recovery creates one draft")
# Deadline budget is checked before each attempt and before sleeping; no hidden unbounded retry.
def bounded(work,budget,maximum=3,clock=time.monotonic,sleep=time.sleep):
 start=clock()
 attempts=0
 while attempts<maximum:
  if clock()-start>=budget:
   raise TimeoutError("retry deadline exceeded")
  attempts+=1
  try:
   return work(attempts)
  except psycopg.Error as e:
   if e.sqlstate not in ("40P01","40001"): raise
   if attempts==maximum: raise
   wait=min(.03*2**(attempts-1),.12)
   if clock()-start+wait>=budget:
    raise TimeoutError("retry budget exhausted") from e
   sleep(wait)
 raise AssertionError("unreachable")
# Synthetic clock: deterministic deadline rejection and bounded attempt count.
now=[0.]
attempts=[]
def clock(): return now[0]
def sleep(t): now[0]+=t
def serial_failure(i):
 attempts.append(i)
 raise errors.SerializationFailure("injected 40001")
try: bounded(serial_failure,.02,clock=clock,sleep=sleep)
except TimeoutError: pass
else: raise AssertionError("deadline should prevent sleep/retry")
assert attempts==[1]
print("PASS retry time budget prevents extra attempts and excessive sleep")
# Non-retryable SQLSTATE 23505 is propagated immediately.
attempts=[]
def nonretry(i):
 attempts.append(i)
 with psycopg.connect(ADMIN) as c:
  c.execute("INSERT INTO ed_integrated_lab.versions(tenant,revision) VALUES('a',0)")
try: bounded(nonretry,5)
except errors.UniqueViolation as e: assert e.sqlstate=="23505"
else: raise AssertionError("23505 must not retry")
assert attempts==[1]
print("PASS non-retryable 23505 immediately propagated, no extra attempts")
with psycopg.connect(ADMIN) as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
 assert c.execute("SELECT rolbypassrls FROM pg_roles WHERE rolname='ed_integrated_owner'").fetchone()[0] is False
 assert c.execute("SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='ed_integrated_lab'::regnamespace AND relkind='r'").fetchone()[0] is True
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id IN ('unknown-committed-product','unknown-aborted-product')").fetchone()[0]==2
assert revision()==12
print("PASS RLS FORCE, non-BYPASSRLS owner, CAS revisions, drafts unpublished")
