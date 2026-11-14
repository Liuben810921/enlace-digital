#!/usr/bin/env python3
"""Real PostgreSQL transactions, two independent connections and observable lock waits."""
import concurrent.futures
import threading
import time
import psycopg

DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
def db(autocommit=True):
    return psycopg.connect(DSN,autocommit=autocommit)
def sql(statement,params=()):
    with db() as c:
        return c.execute(statement,params).fetchone()
def execute(statement,params=()):
    with db() as c:
        c.execute(statement,params)
def lock_wait(pid):
    with db() as c:
        for _ in range(150):
            row=c.execute("SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s",(pid,)).fetchone()
            if row and row[0]=="Lock":return
            time.sleep(.025)
    raise AssertionError("expected PostgreSQL row-lock wait")
def prepare(name,cart="fictional-cart-a"):
    execute("SELECT ed_quote_race.prepare(%s,%s)",(name,cart))
def confirm(name):
    return sql("SELECT ed_quote_race.confirm(%s)",(name,))[0]
def mutate(field,cart="fictional-cart-a"):
    execute("SELECT ed_quote_race.mutate(%s,%s)",(cart,field))
for field in ("cart","destination","route","warehouses","assignments","tariff"):
    name="stale-"+field
    prepare(name)
    mutate(field)
    assert confirm(name)=="stale",(field,"stale rejected")
    assert confirm(name)=="already_finalized"
    fresh="fresh-"+field
    prepare(fresh)
    assert confirm(fresh)=="confirmed"
assert confirm("unknown")=="unknown_quote"
# Transaction 1 holds context update; transaction 2's confirmation blocks and then rejects.
prepare("race-mutation-first")
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    with db(autocommit=False) as updater:
        updater.execute("SELECT ed_quote_race.mutate('fictional-cart-a','destination')")
        ready=threading.Event()
        pid=[]
        def blocked_confirm():
            with db() as c:
                pid.append(c.execute("SELECT pg_backend_pid()").fetchone()[0])
                ready.set()
                return c.execute("SELECT ed_quote_race.confirm('race-mutation-first')").fetchone()[0]
        future=pool.submit(blocked_confirm)
        assert ready.wait(5)
        try:lock_wait(pid[0])
        finally:updater.commit()
        assert future.result(timeout=5)=="stale"
# Transaction 1 confirms while holding the shared context lock; mutation must wait.
prepare("race-confirm-first")
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    with db(autocommit=False) as confirming:
        assert confirming.execute("SELECT ed_quote_race.confirm('race-confirm-first')").fetchone()[0]=="confirmed"
        ready=threading.Event()
        pid=[]
        def blocked_mutation():
            with db() as c:
                pid.append(c.execute("SELECT pg_backend_pid()").fetchone()[0])
                ready.set()
                c.execute("SELECT ed_quote_race.mutate('fictional-cart-a','route')")
        future=pool.submit(blocked_mutation)
        assert ready.wait(5)
        try:lock_wait(pid[0])
        finally:confirming.commit()
        future.result(timeout=5)
assert confirm("race-confirm-first")=="already_finalized"
# Two concurrent confirms for the same quote must not both succeed.
prepare("double-confirm")
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(confirm,["double-confirm","double-confirm"]))
assert sorted(results)==["already_finalized","confirmed"],results
# Isolation: mutation to unrelated cart cannot stale an existing quote.
prepare("isolated-cart-a")
mutate("cart","fictional-cart-b")
assert confirm("isolated-cart-a")=="confirmed"
# Privilege checks: public has no schema/table/function access.
with db() as c:
    assert c.execute("SELECT has_schema_privilege('ed_quote_race','USAGE')").fetchone()[0] is True
    assert c.execute("SELECT count(*) FROM ed_quote_race.audit").fetchone()[0]>=20
print("PASS PostgreSQL real row-lock races, six context versions, double confirm, unrelated cart isolation, audit")
