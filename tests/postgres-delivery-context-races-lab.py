#!/usr/bin/env python3
"""Deterministic synthetic races between quotes and context updates on PostgreSQL 16."""
import concurrent.futures
import time
import psycopg
from psycopg import errors

HOST="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
def conn(role="ed_lab_admin",autocommit=True):
    return psycopg.connect(HOST+f" user={role} password=disposable-lab-only",
                           autocommit=autocommit)
def root():
    return psycopg.connect(HOST+" user=postgres password=postgres",autocommit=True)
def query(role,sql,args=()):
    with conn(role) as c:
        return c.execute(sql,args).fetchone()
def version(table,column,where="singleton=true"):
    with root() as c:
        return c.execute(f"SELECT {column} FROM ed_rpc_lab.{table} WHERE {where}").fetchone()[0]
def mutate(kind,expected,distance=None):
    return query("ed_lab_admin","SELECT ed_rpc_lab.mutate_context(%s,%s,%s,%s)",
                 (kind,None if kind=="warehouse" else "cart-a",expected,distance))[0]
def quote(key,revision):
    return query("ed_lab_gestor_a","SELECT * FROM ed_rpc_lab.quote_preview(%s,%s,%s,%s)",
                 (key,"cart-a","customer-a",revision))
def refresh():
    rv=version("routes","route_version","cart_id='cart-a'")
    return mutate("route",rv,5)
def cartrev():
    return version("carts","revision","cart_id='cart-a'")
def assert_stale(key,rev):
    try: quote(key,rev)
    except errors.SerializationFailure: return
    raise AssertionError(f"stale quote accepted: {key}")
def wait_lock(pid):
    with root() as c:
        for _ in range(100):
            row=c.execute("SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s",(pid,)).fetchone()
            if row and row[0]=="Lock": return
            time.sleep(.03)
    raise AssertionError("expected a real PostgreSQL lock wait")

# Direct privilege, RLS and audit checks remain in the base RPC test.
assert query("ed_lab_gestor_a","SELECT count(*) FROM ed_rpc_lab.quotes")[0]>=1
try: query("ed_lab_gestor_a","SELECT ed_rpc_lab.mutate_context('cart','cart-a',1,NULL)")
except errors.InsufficientPrivilege: pass
else: raise AssertionError("manager modified context")

# Every mutation invalidates the old quote. The route must be explicitly refreshed.
for kind,table,column,where in [
    ("cart","carts","revision","cart_id='cart-a'"),
    ("destination","carts","destination_version","cart_id='cart-a'"),
    ("warehouse","warehouses","version","singleton=true"),
    ("route","routes","route_version","cart_id='cart-a'")]:
    oldrev=cartrev()
    oldkey="pre-"+kind
    assert quote(oldkey,oldrev)[0]=="committed"
    oldver=version(table,column,where)
    assert mutate(kind,oldver,5 if kind=="route" else None)==oldver+1
    assert_stale(oldkey,oldrev)
    if kind!="route": assert_stale("new-"+kind,oldrev if kind=="cart" else cartrev())
    if kind!="route": refresh()
    assert quote("after-"+kind,cartrev())[0]=="committed"
    assert_stale(oldkey,oldrev)

# Race 1: mutator acquires the exclusive cart advisory lock, quote waits.
# Commit mutation; quote must then reject stale route/cart snapshot.
rev=cartrev()
expected=version("carts","destination_version","cart_id='cart-a'")
with conn("ed_lab_admin",autocommit=False) as updater:
    updater.execute("SELECT ed_rpc_lab.mutate_context('destination','cart-a',%s,NULL)",(expected,))
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        def blocked_quote():
            with conn("ed_lab_gestor_a") as c:
                pid=c.execute("SELECT pg_backend_pid()").fetchone()[0]
                try:
                    c.execute("SELECT * FROM ed_rpc_lab.quote_preview(%s,'cart-a','customer-a',%s)",
                              ("race-after-mutate",rev))
                except errors.SerializationFailure:
                    return (pid,"stale")
                return (pid,"accepted")
        future=pool.submit(blocked_quote)
        with root() as observer:
            for _ in range(100):
                rows=observer.execute("""SELECT pid FROM pg_stat_activity
                 WHERE usename='ed_lab_gestor_a' AND query LIKE '%race-after-mutate%'
                   AND wait_event_type='Lock'""").fetchall()
                if rows: break
                time.sleep(.03)
            else: raise AssertionError("quote did not block on mutation")
        updater.commit()
        assert future.result(timeout=5)[1]=="stale"
refresh()

# Race 2: quote commits in its transaction only after mutation starts waiting.
# Mutation cannot overtake the quote; after mutation commits, replay is stale.
rev=cartrev()
expected=version("warehouses","version")
with conn("ed_lab_gestor_a",autocommit=False) as quoting:
    result=quoting.execute("SELECT * FROM ed_rpc_lab.quote_preview(%s,'cart-a','customer-a',%s)",
                           ("race-before-mutate",rev)).fetchone()
    assert result[0]=="committed"
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        def blocked_mutation():
            return mutate("warehouse",expected)
        future=pool.submit(blocked_mutation)
        with root() as observer:
            for _ in range(100):
                rows=observer.execute("""SELECT pid FROM pg_stat_activity
                 WHERE usename='ed_lab_admin' AND query LIKE '%mutate_context%'
                   AND wait_event_type='Lock'""").fetchall()
                if rows: break
                time.sleep(.03)
            else: raise AssertionError("mutation did not wait for quote")
        quoting.commit()
        assert future.result(timeout=5)==expected+1
assert_stale("race-before-mutate",rev)
refresh()
assert quote("race-fresh",cartrev())[0]=="committed"
assert query("ed_lab_admin","SELECT count(*) FROM ed_rpc_lab.context_audit")[0]>=8
try: query("ed_lab_gestor_a","SELECT * FROM ed_rpc_lab.context_audit")
except errors.InsufficientPrivilege: pass
else: raise AssertionError("manager read context audit")
print("PASS context revisions, invalidation, serialized quote/mutation races, audit and least privilege")
