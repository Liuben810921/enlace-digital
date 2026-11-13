#!/usr/bin/env python3
"""Cancellation and transaction recovery tests against disposable PostgreSQL only."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors

DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
def db():
    return psycopg.connect(DSN, autocommit=True)
def check(ok, message):
    if not ok: raise AssertionError(message)
def count(key):
    with db() as c:
        return c.execute("SELECT count(*) FROM quote_lab.operations WHERE operation_key=%s",(key,)).fetchone()[0]
def quote(key,amount=700,version=4):
    with db() as c:
        return c.execute("SELECT outcome,amount FROM quote_lab.quote(%s,%s,%s,%s,%s)",
            ("gestor",key,"payload",amount,version)).fetchone()

# Cancel a running statement inside an explicit transaction. Its preceding insert must roll back.
ready=threading.Event()
def cancel_worker():
    with db() as c:
        c.execute("BEGIN")
        c.execute("SELECT outcome FROM quote_lab.quote('gestor','cancelled-query','payload',701,4)")
        pid=c.execute("SELECT pg_backend_pid()").fetchone()[0]
        ready.pid=pid
        ready.set()
        try:
            c.execute("SELECT pg_sleep(15)")
            raise AssertionError("query was not cancelled")
        except errors.QueryCanceled:
            check(c.info.transaction_status==psycopg.pq.TransactionStatus.INERROR,"transaction should be aborted")
            c.execute("ROLLBACK")
        return "cancelled"
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(cancel_worker)
    check(ready.wait(10),"cancel worker not ready")
    with db() as c:
        check(c.execute("SELECT pg_cancel_backend(%s)",(ready.pid,)).fetchone()[0],"cancel signal failed")
    check(future.result(timeout=10)=="cancelled","cancel worker failed")
check(count("cancelled-query")==0,"cancel left a committed operation")
check(quote("cancelled-query",701)==("committed",701),"retry after cancel failed")

# statement_timeout aborts the entire transaction, not just the timed statement.
with db() as c:
    c.execute("BEGIN")
    c.execute("SET LOCAL statement_timeout='120ms'")
    c.execute("SELECT outcome FROM quote_lab.quote('gestor','statement-timeout','payload',702,4)")
    try:
        c.execute("SELECT pg_sleep(1)")
        raise AssertionError("statement timeout did not fire")
    except errors.QueryCanceled:
        check(c.info.transaction_status==psycopg.pq.TransactionStatus.INERROR,"timeout must abort transaction")
        c.execute("ROLLBACK")
check(count("statement-timeout")==0,"statement timeout left operation")
check(quote("statement-timeout",702)==("committed",702),"statement timeout retry failed")

# lock_timeout while another connection owns an exclusive lock.
locked=threading.Event()
release=threading.Event()
def locker():
    with db() as c:
        c.execute("BEGIN")
        c.execute("UPDATE quote_lab.settings SET threshold_usd=threshold_usd WHERE singleton=true")
        locked.set()
        check(release.wait(10),"lock release timed out")
        c.execute("ROLLBACK")
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(locker)
    check(locked.wait(10),"locker did not acquire lock")
    with db() as c:
        c.execute("BEGIN")
        c.execute("SET LOCAL lock_timeout='120ms'")
        try:
            c.execute("SELECT outcome FROM quote_lab.quote('gestor','lock-timeout','payload',703,4)")
            raise AssertionError("lock timeout did not fire")
        except errors.LockNotAvailable:
            check(c.info.transaction_status==psycopg.pq.TransactionStatus.INERROR,"lock timeout must abort transaction")
            c.execute("ROLLBACK")
    release.set()
    future.result(timeout=10)
check(count("lock-timeout")==0,"lock timeout persisted operation")
check(quote("lock-timeout",703)==("committed",703),"lock timeout recovery failed")

# Deadlock in a transaction that includes a real quote. Loser retries the complete
# transaction with bounded exponential backoff, not just the failed statement.
start=threading.Barrier(2)
def quote_deadlock(first,second,key):
    errors_seen=[]
    for attempt in range(4):
        try:
            with db() as c:
                c.execute("BEGIN")
                c.execute(f"UPDATE quote_lab.deadlock_{first} SET value=value+1 WHERE id=1")
                if attempt==0: start.wait(timeout=10)
                c.execute(f"UPDATE quote_lab.deadlock_{second} SET value=value+1 WHERE id=1")
                result=c.execute("SELECT outcome,amount FROM quote_lab.quote(%s,%s,%s,%s,%s)",
                    ("gestor",key,"payload",704,4)).fetchone()
                c.execute("COMMIT")
                return result,errors_seen
        except errors.DeadlockDetected:
            errors_seen.append("40P01")
            if attempt==3: raise
            time.sleep(min(0.025*(2**attempt),0.1))
    raise AssertionError("deadlock retry exhausted")
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    futures=[pool.submit(quote_deadlock,"a","b","deadlock-quote-a"),
             pool.submit(quote_deadlock,"b","a","deadlock-quote-b")]
    outcomes=[f.result(timeout=20) for f in futures]
check(sum(len(item[1]) for item in outcomes)==1,f"expected one 40P01, got {outcomes}")
for key in ("deadlock-quote-a","deadlock-quote-b"):
    check(count(key)==1,f"duplicate or lost deadlock quote {key}")
    check(quote(key,999)==("replayed",704),f"deadlock retry not idempotent {key}")

# Abrupt backend termination before commit: uncommitted quote disappears.
pid_ready=threading.Event()
def terminated_worker():
    try:
        with db() as c:
            c.execute("BEGIN")
            c.execute("SELECT outcome FROM quote_lab.quote('gestor','terminated-tx','payload',705,4)")
            pid_ready.pid=c.execute("SELECT pg_backend_pid()").fetchone()[0]
            pid_ready.set()
            c.execute("SELECT pg_sleep(15)")
            raise AssertionError("backend was not terminated")
    except (psycopg.OperationalError,psycopg.InterfaceError):
        return "terminated"
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    future=pool.submit(terminated_worker)
    check(pid_ready.wait(10),"backend not ready")
    with db() as c:
        check(c.execute("SELECT pg_terminate_backend(%s)",(pid_ready.pid,)).fetchone()[0],"termination failed")
    check(future.result(timeout=10)=="terminated","backend termination did not interrupt transaction")
check(count("terminated-tx")==0,"terminated transaction was not rolled back")
check(quote("terminated-tx",705)==("committed",705),"terminated transaction retry failed")
print("PASS cancellation, statement_timeout, lock_timeout, quote deadlock+backoff, abrupt termination+rollback, idempotent recovery")
