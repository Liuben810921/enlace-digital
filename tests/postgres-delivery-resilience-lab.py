#!/usr/bin/env python3
"""Real PostgreSQL connections, disposable GitHub Actions service only."""
import concurrent.futures
import os
import threading
import time
import psycopg
from psycopg import errors

DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
def connect():
    return psycopg.connect(DSN, autocommit=True)
def one(sql, params=()):
    with connect() as c:
        return c.execute(sql,params).fetchone()[0]
def check(value,msg):
    if not value: raise AssertionError(msg)

# Force a genuine PostgreSQL 40P01 cycle: A then B versus B then A.
barrier=threading.Barrier(2)
def deadlock(first,second):
    try:
        with connect() as c:
            c.execute("BEGIN")
            c.execute(f"UPDATE quote_lab.deadlock_{first} SET value=value+1 WHERE id=1")
            barrier.wait(timeout=10)
            c.execute(f"UPDATE quote_lab.deadlock_{second} SET value=value+1 WHERE id=1")
            c.execute("COMMIT")
        return "committed"
    except errors.DeadlockDetected:
        return "40P01"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    futures=[pool.submit(deadlock,"a","b"),pool.submit(deadlock,"b","a")]
    outcomes=[f.result(timeout=15) for f in futures]
check(sorted(outcomes)==["40P01","committed"],f"deadlock outcomes {outcomes}")

# Bounded retry with exponential backoff and a new transaction on each attempt.
attempts=[]
def retry_quote(key,version=2,max_attempts=4):
    for attempt in range(max_attempts):
        try:
            with connect() as c:
                row=c.execute("SELECT outcome,amount FROM quote_lab.quote(%s,%s,%s,%s,%s)",
                    ("gestor",key,"payload",700,version)).fetchone()
            return row
        except (errors.SerializationFailure,errors.DeadlockDetected):
            attempts.append(attempt)
            if attempt==max_attempts-1: raise
            time.sleep(min(0.025*(2**attempt),0.1))
    raise AssertionError("unreachable")
check(retry_quote("retry-new")==("committed",700),"retry first quote")
check(retry_quote("retry-new")==("replayed",700),"retry idempotency")
# Permanent stale version must stop after bounded retries; not silently use stale price.
try:
    retry_quote("retry-stale",version=1,max_attempts=3)
    raise AssertionError("stale quote accepted")
except errors.SerializationFailure:
    check(len(attempts)==3,f"expected 3 bounded retries, got {attempts}")

# Simultaneous address, warehouse and tariff edits compete with a quote bound to all versions.
# The quote can commit before a change; it must not commit after a version has changed.
one("UPDATE quote_lab.routing_context SET address_version=1,warehouse_version=1 WHERE singleton=true RETURNING address_version")
one("UPDATE quote_lab.settings SET version=3 WHERE singleton=true RETURNING version")
start=threading.Barrier(4)
def bound_quote():
    start.wait(timeout=10)
    try:
        with connect() as c:
            return c.execute("SELECT outcome FROM quote_lab.quote_bound(%s,%s,%s,%s,%s,%s,%s)",
                ("gestor","race-route","payload",700,3,1,1)).fetchone()[0]
    except errors.SerializationFailure:
        return "stale"
def change_address():
    start.wait(timeout=10)
    return one("UPDATE quote_lab.routing_context SET address_version=address_version+1 WHERE singleton=true RETURNING address_version")
def change_warehouse():
    start.wait(timeout=10)
    return one("UPDATE quote_lab.routing_context SET warehouse_version=warehouse_version+1 WHERE singleton=true RETURNING warehouse_version")
def change_tariff():
    start.wait(timeout=10)
    return one("SELECT quote_lab.change_threshold('admin-race',3,275)")
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    futures=[pool.submit(f) for f in [bound_quote,change_address,change_warehouse,change_tariff]]
    results=[f.result(timeout=20) for f in futures]
check(results[0] in ("committed","stale"),f"unexpected quote race {results}")
check(one("SELECT address_version FROM quote_lab.routing_context")==2,"address update lost")
check(one("SELECT warehouse_version FROM quote_lab.routing_context")==2,"warehouse update lost")
check(one("SELECT version FROM quote_lab.settings")==4,"tariff update lost")
with connect() as c:
    for key in ("stale-address","stale-warehouse","stale-tariff"):
        try:
            c.execute("SELECT * FROM quote_lab.quote_bound(%s,%s,%s,%s,%s,%s,%s)",
                ("gestor",key,"payload",700,3,1,1))
            raise AssertionError("stale route accepted")
        except errors.SerializationFailure:
            pass

# Lost COMMIT acknowledgment simulation: commit then kill backend while subsequent
# response is pending. The client sees connection loss; durable row is checked by retry.
def disconnect_worker(ready,finished):
    try:
        with connect() as c:
            c.execute("BEGIN")
            pid=c.execute("SELECT pg_backend_pid()").fetchone()[0]
            ready.append(pid)
            c.execute("SELECT outcome FROM quote_lab.quote('gestor','disconnect','payload',777,4)")
            # A multi-statement command: COMMIT happens before pg_sleep, then backend is killed.
            c.execute("COMMIT; SELECT pg_sleep(5)")
    except (psycopg.OperationalError,psycopg.InterfaceError) as e:
        finished.append(type(e).__name__)
ready=[]
finished=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(disconnect_worker,ready,finished)
    deadline=time.monotonic()+10
    while not ready and time.monotonic()<deadline: time.sleep(.01)
    check(bool(ready),"missing backend pid")
    # Wait until row is committed before terminating; client has not returned.
    deadline=time.monotonic()+10
    while time.monotonic()<deadline:
        if one("SELECT count(*) FROM quote_lab.operations WHERE operation_key='disconnect'")==1:
            break
        time.sleep(.02)
    else: raise AssertionError("commit did not become visible")
    with connect() as c:
        c.execute("SELECT pg_terminate_backend(%s)",(ready[0],))
    future.result(timeout=10)
check(bool(finished),f"disconnect did not interrupt client: {finished}")
check(one("SELECT count(*) FROM quote_lab.operations WHERE operation_key='disconnect'")==1,"commit lost")
check(retry_quote("disconnect",version=4)==("replayed",777),"retry after lost response")
print("PASS PostgreSQL 40P01 deadlock, bounded backoff, concurrent address/warehouse/tariff changes, lost commit response, idempotent recovery")
