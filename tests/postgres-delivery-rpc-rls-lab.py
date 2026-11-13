#!/usr/bin/env python3
"""Disposable PostgreSQL RPC and RLS acceptance checks, synthetic roles only."""
import concurrent.futures
import psycopg
from psycopg import errors
DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
def db(role=None):
    c=psycopg.connect(DSN,autocommit=True)
    if role: c.execute("SET ROLE "+role)
    return c
def run(role,sql,params=()):
    with db(role) as c:
        return c.execute(sql,params).fetchall()
def assert_error(role,sql,exc,params=()):
    try: run(role,sql,params)
    except exc: return
    raise AssertionError(f"{role} should reject {sql}")
q="SELECT * FROM ed_rpc_lab.quote_preview(%s,%s,%s,%s)"
u="SELECT ed_rpc_lab.update_rate(%s,%s,%s)"
a="ed_lab_gestor_a";b="ed_lab_gestor_b";admin="ed_lab_admin";sup="ed_lab_supervisor"
assert run(a,"SELECT cart_id FROM ed_rpc_lab.carts")==[("cart-a",)]
assert run(b,"SELECT cart_id FROM ed_rpc_lab.carts")==[("cart-b",)]
assert_error(a,"INSERT INTO ed_rpc_lab.carts VALUES ('evil','ed_lab_gestor_a','x',1,1)",errors.InsufficientPrivilege)
assert_error(a,"SELECT * FROM ed_rpc_lab.routes",errors.InsufficientPrivilege)
assert_error(a,"SELECT * FROM ed_rpc_lab.audit",errors.InsufficientPrivilege)
assert_error(sup,"SELECT * FROM ed_rpc_lab.carts",errors.InsufficientPrivilege)
assert_error(sup,q,errors.InsufficientPrivilege,("s","cart-a","customer-a",1))
assert_error(a,u,errors.InsufficientPrivilege,(1,300,"forbidden"))
assert_error(b,q,errors.InsufficientPrivilege,("cross","cart-a","customer-a",1))
assert_error(a,q,errors.InsufficientPrivilege,("wrong","cart-a","customer-b",1))
assert run(a,q,("idempotent","cart-a","customer-a",1))==[("committed",1000,1000,0)]
assert run(a,q,("idempotent","cart-a","customer-a",1))==[("replayed",1000,1000,0)]
assert run(b,q,("free","cart-b","customer-b",1))==[("committed",1600,0,1600)]
assert run(a,"SELECT operation_key FROM ed_rpc_lab.quotes")==[("idempotent",)]
assert run(b,"SELECT operation_key FROM ed_rpc_lab.quotes")==[("free",)]
assert run(admin,q,("admin-preview","cart-a","customer-a",1))==[("committed",1000,1000,0)]
assert run(admin,u,(1,250,"synthetic tariff update"))==[(2,)]
assert run(admin,"SELECT version,actor_role,previous_rate,next_rate FROM ed_rpc_lab.audit")==[(2,"ed_lab_admin",200,250)]
assert_error(a,q,errors.SerializationFailure,("idempotent","cart-a","customer-a",1))
assert_error(admin,u,errors.SerializationFailure,(1,300,"stale"))
assert_error(a,"DELETE FROM ed_rpc_lab.quotes",errors.InsufficientPrivilege)
assert_error(admin,"UPDATE ed_rpc_lab.audit SET reason='tampered'",errors.InsufficientPrivilege)
# Same key, multiple concurrent sessions: unique persisted row and deterministic result.
def concurrent(_):
    return run(a,q,("parallel","cart-a","customer-a",1))[0]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    rows=list(pool.map(concurrent,range(8)))
assert all(x[1:]==(1250,1250,0) for x in rows),rows
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes WHERE operation_key='parallel'")==[(1,)]
print("PASS disposable PostgreSQL RPC, RLS, grants, manager isolation, admin-only tariff audit, idempotency and concurrency")
