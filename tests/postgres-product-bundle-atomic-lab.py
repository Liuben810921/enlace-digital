#!/usr/bin/env python3
"""Disposable PostgreSQL transactional product bundle tests; never connects to Supabase."""
import concurrent.futures
import threading
import time
import psycopg

DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
SQL="SELECT ed_bundle_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def db():
    c=psycopg.connect(DSN,autocommit=False)
    c.execute("SET ROLE ed_bundle_client")
    return c
def commit(op,product,revision,supplier="s1",warehouse="w1",kind="proveedor"):
    with db() as c:
        result=c.execute(SQL,(op,product,supplier,warehouse,kind,revision)).fetchone()[0]
        c.commit()
        return result
def status(result):return result["status"]
with db() as c:
    assert c.execute("SELECT current_user").fetchone()[0]=="ed_bundle_client"
    assert c.execute("SELECT rolbypassrls FROM pg_roles WHERE rolname='ed_bundle_owner'").fetchone()[0] is False
    assert c.execute("SELECT has_table_privilege(current_user,'ed_bundle_lab.products','INSERT')").fetchone()[0] is False
    assert c.execute("SELECT has_function_privilege(current_user,'ed_bundle_lab.commit_bundle(text,text,text,text,text,bigint)','EXECUTE')").fetchone()[0] is True
    c.commit()
print("PASS RLS technical owner without BYPASSRLS, no direct client write")
first=commit("op-a","p-a",0)
assert status(first)=="draft" and first["published"] is False and first["revision"]==1
assert commit("op-a","p-a",0)["replayed"] is True
assert status(commit("op-a","different",1))=="idempotency_conflict"
assert status(commit("stale","p-stale",0))=="stale_revision"
assert status(commit("invalid","p-invalid",1,supplier="disabled"))=="invalid_origin"
assert status(commit("own","p-own",1,supplier=None,warehouse="own",kind="propio"))=="draft"
assert status(commit("duplicate-product","p-a",2))=="product_conflict"
print("PASS CAS, draft, active warehouse, own origin, idempotency, unknown-result replay")
# A transaction that rolls back must not create an operation or advance revision.
with db() as c:
    assert status(c.execute(SQL,("rolled","p-rolled","s1","w1","proveedor",2)).fetchone()[0])=="draft"
    c.rollback()
assert status(commit("rolled","p-rolled",2))=="draft"
print("PASS rollback restores product, operation and revision atomically")
# Two distinct clients compete for the same expected revision. The second blocks on row lock.
started=threading.Event()
def competing():
    with db() as c:
        pid=c.execute("SELECT pg_backend_pid()").fetchone()[0]
        started.set()
        result=c.execute(SQL,("race-b","p-race-b","s1","w1","proveedor",3)).fetchone()[0]
        c.commit()
        return pid,result
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    with db() as c:
        result=c.execute(SQL,("race-a","p-race-a","s1","w1","proveedor",3)).fetchone()[0]
        assert status(result)=="draft"
        future=pool.submit(competing)
        assert started.wait(5)
        time.sleep(.2)
        assert not future.done(),"competing transaction must wait for row lock"
        c.commit()
    pid,loser=future.result(timeout=10)
assert status(loser)=="stale_revision"
assert status(commit("race-b","p-race-b",4))=="draft"
assert commit("race-a","p-race-a",3)["replayed"] is True
print("PASS real two-connection row-lock concurrency, stale loser, retry, unknown commit replay")
with db() as c:
    assert c.execute("SELECT count(*) FROM ed_bundle_lab.products WHERE published").fetchone()[0]==0
    assert c.execute("SELECT revision FROM ed_bundle_lab.context WHERE id=1").fetchone()[0]==5
    assert c.execute("SELECT count(*) FROM ed_bundle_lab.operations").fetchone()[0]==5
    c.commit()
print("PASS PostgreSQL synthetic product bundle transaction laboratory")
