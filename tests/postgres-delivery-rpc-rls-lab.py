#!/usr/bin/env python3
"""Disposable PostgreSQL RPC and RLS acceptance checks, synthetic roles only."""
import concurrent.futures
import threading
import time
import psycopg
from psycopg import errors
DSN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
def db(role=None):
    c=psycopg.connect(DSN if role is None else
        "host=127.0.0.1 port=5432 dbname=postgres user="+role+" password=disposable-lab-only connect_timeout=5",autocommit=True)
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

# Catalog evidence: function owner cannot bypass RLS and is not a superuser.
assert run(None,"SELECT rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname='ed_lab_rpc_owner'")==[(False,False,False)]
assert run(None,"SELECT DISTINCT pg_get_userbyid(p.proowner) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='ed_rpc_lab'")==[("ed_lab_rpc_owner",)]
assert run(None,"SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ed_rpc_lab' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity")==[(7,)]
assert run(None,"SELECT has_table_privilege('ed_lab_rpc_owner','ed_rpc_lab.carts','UPDATE')")==[(True,)]
assert run(None,"SELECT has_table_privilege('ed_lab_gestor_a','ed_rpc_lab.carts','UPDATE')")==[(False,)]
assert run(None,"SELECT has_table_privilege('ed_lab_rpc_owner','ed_rpc_lab.audit','DELETE')")==[(False,)]

assert run(a,"SELECT cart_id FROM ed_rpc_lab.carts")==[("cart-a",)]
assert run(b,"SELECT cart_id FROM ed_rpc_lab.carts")==[("cart-b",)]
assert_error(a,"SET ROLE ed_lab_rpc_owner",errors.InsufficientPrivilege)
assert_error(b,"SET ROLE ed_lab_gestor_a",errors.InsufficientPrivilege)
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
def parallel_quote(_):
    return run(a,q,("parallel","cart-a","customer-a",1))[0]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    rows=list(pool.map(parallel_quote,range(8)))
assert all(x[1:]==(1250,1250,0) for x in rows),rows
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes WHERE operation_key='parallel'")==[(1,)]

# Regression: delimiter-joined tuples were ambiguous (a:b,c vs a,b:c).
# A structured PostgreSQL JSONB tuple is unambiguous for these distinct identities.
assert run(None, """SELECT
 md5(jsonb_build_array('a:b','c',1)::text) <>
 md5(jsonb_build_array('a','b:c',1)::text)""")==[(True,)]
# No login role may mutate protected versioned state or audit directly.
for role in (a,b,admin,sup):
    for table in ("carts","routes","warehouses","settings","quotes","audit","context_audit"):
        assert run(None,"SELECT has_table_privilege(%s,%s,'DELETE')",(role,"ed_rpc_lab."+table))==[(False,)]
for role in (a,b,sup):
    for table in ("carts","routes","warehouses","settings","quotes"):
        assert run(None,"SELECT has_table_privilege(%s,%s,'UPDATE')",(role,"ed_rpc_lab."+table))==[(False,)]
assert run(None,"SELECT has_table_privilege('ed_lab_rpc_owner','ed_rpc_lab.carts','DELETE')")==[(False,)]
assert run(None,"SELECT has_table_privilege('ed_lab_rpc_owner','ed_rpc_lab.routes','INSERT')")==[(False,)]


# Snapshot isolation is intentionally unsupported: an old MVCC snapshot could
# survive an advisory lock wait and accept stale versions.
for isolation in ("REPEATABLE READ","SERIALIZABLE"):
    for role,sql,params in (
        (a,q,("snapshot-"+isolation,"cart-a","customer-a",1)),
        (admin,u,(2,275,"snapshot guard")),
        (admin,"SELECT ed_rpc_lab.mutate_context(%s,%s,%s,%s)",("cart","cart-a",1,None)),
    ):
        with db(role) as c:
            c.execute("BEGIN ISOLATION LEVEL "+isolation)
            try:
                c.execute(sql,params)
            except errors.FeatureNotSupported:
                c.rollback()
            else:
                c.rollback()
                raise AssertionError(f"{role}: {isolation} accepted on guarded RPC")
# An administrator login cannot bypass version locks with direct table writes.
for table,statement in (
    ("carts","UPDATE ed_rpc_lab.carts SET revision=revision+1 WHERE cart_id='cart-a'"),
    ("routes","UPDATE ed_rpc_lab.routes SET route_version=route_version+1 WHERE cart_id='cart-a'"),
    ("warehouses","UPDATE ed_rpc_lab.warehouses SET version=version+1 WHERE singleton=true"),
    ("settings","UPDATE ed_rpc_lab.settings SET version=version+1 WHERE singleton=true"),
):
    assert_error(admin,statement,errors.InsufficientPrivilege)


# Cross-cart operation-key collision under concurrent admin requests must fail
# closed, not return another cart's committed fee.
def cross_cart(cart,customer):
    try:
        return run(admin,q,("cross-cart-key",cart,customer,1))[0]
    except errors.UniqueViolation:
        return "conflict"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    outcomes=list(pool.map(lambda x: cross_cart(*x),
                           [("cart-a","customer-a"),("cart-b","customer-b")]))
assert outcomes.count("conflict")==1, outcomes
assert sum(isinstance(x,tuple) and x[0]=="committed" for x in outcomes)==1, outcomes
assert run(admin,"SELECT count(*) FROM ed_rpc_lab.quotes WHERE operation_key='cross-cart-key'")==[(1,)]


# A route can expire while replay waits on a locked idempotency row.
assert run(a,q,("expiry-wait","cart-a","customer-a",1))[0][0]=="committed"
with db(None) as root_conn:
    root_conn.execute("UPDATE ed_rpc_lab.routes SET expires_at=clock_timestamp()+interval '1 second' WHERE cart_id='cart-a'")
started=threading.Event()
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    # Only the disposable fixture superuser can lock the protected quote row.
    # The login admin correctly lacks direct SELECT FOR UPDATE privileges.
    with db(None) as blocker:
        blocker.execute("BEGIN")
        blocker.execute("SELECT * FROM ed_rpc_lab.quotes WHERE actor_role=%s AND operation_key=%s FOR UPDATE",(a,"expiry-wait"))
        def delayed_replay():
            with db(a) as c:
                started.set()
                try:
                    c.execute(q,("expiry-wait","cart-a","customer-a",1))
                except errors.SerializationFailure:
                    return "expired"
                return "accepted"
        future=pool.submit(delayed_replay)
        assert started.wait(5)
        time.sleep(1.3)
        blocker.execute("COMMIT")
        assert future.result(timeout=5)=="expired"
with db(None) as root_conn:
    root_conn.execute("UPDATE ed_rpc_lab.routes SET expires_at=clock_timestamp()+interval '1 hour' WHERE cart_id='cart-a'")

# Unicode-only whitespace must not count as an explanatory tariff audit reason.
unicode_blank_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
unicode_blank_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for unicode_blank in ("\u00a0"*3,"\u202f"*3,"\u3000"*3):
    assert_error(admin,u,errors.InvalidParameterValue,(unicode_blank_before[0][0],275,unicode_blank))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==unicode_blank_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==unicode_blank_audit_before

# Invisible format characters must not satisfy the minimum tariff reason length.
invisible_reason_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
invisible_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for invisible_reason in ("\u200b"*3,"\u2060"*3,"\ufeff"*3):
    assert_error(admin,u,errors.InvalidParameterValue,(invisible_reason_before[0][0],275,invisible_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==invisible_reason_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==invisible_audit_before

# Unicode separators can split audit narratives despite POSIX control filtering.
unicode_reason_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
unicode_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for unicode_reason in ("valid\u2028forged event","valid\u2029forged event"):
    assert_error(admin,u,errors.InvalidParameterValue,(unicode_reason_before[0][0],275,unicode_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==unicode_reason_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==unicode_audit_before

# Embedded control characters can forge multi-line tariff audit narratives.
embedded_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
embedded_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for injected_reason in ("valid\nforged event","valid\rforged event","valid\tforged event"):
    assert_error(admin,u,errors.InvalidParameterValue,(embedded_before[0][0],275,injected_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==embedded_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==embedded_audit_before

# A long padded reason must not bypass the 160-character stored audit limit.
padded_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
padded_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for padded_reason in ("valid reason"+" "*161," "*161+"valid reason","\t"*161+"valid reason"):
    assert_error(admin,u,errors.InvalidParameterValue,(padded_before[0][0],275,padded_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==padded_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==padded_audit_before

# Audit reasons containing only control whitespace must be rejected without changing tariff or audit.
rate_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
audit_rate_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for blank_reason in ("\t\t\t","\n\n\n"," \t "):
    assert_error(admin,u,errors.InvalidParameterValue,(rate_before[0][0],275,blank_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==rate_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==audit_rate_before

# Unicode line and paragraph separators are not POSIX control characters.
unicode_key_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for unicode_key in ("order\u2028forged","order\u2029forged"):
    assert_error(a,q,errors.InvalidParameterValue,(unicode_key,"cart-a","customer-a",1))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(unicode_key_before,)]

# Idempotency keys containing embedded control bytes are unsafe opaque identifiers.
control_key_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for control_key in ("order\nforged","order\rforged","order\tforged"):
    assert_error(a,q,errors.InvalidParameterValue,(control_key,"cart-a","customer-a",1))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(control_key_before,)]

# Invisible format-only keys are not meaningful operation identifiers.
invisible_key_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for invisible_key in ("\u200b"*3,"\u2060"*3,"\ufeff"*3):
    assert_error(a,q,errors.InvalidParameterValue,(invisible_key,"cart-a","customer-a",1))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(invisible_key_before,)]

# Unicode whitespace-only idempotency keys must not create persistent operations.
unicode_key_blank_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for unicode_blank_key in ("\u00a0"*3,"\u202f"*3,"\u3000"*3):
    assert_error(a,q,errors.InvalidParameterValue,(unicode_blank_key,"cart-a","customer-a",1))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(unicode_key_blank_before,)]

# Whitespace-only idempotency keys must fail closed without persisting quotes.
blank_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for blank_key in (" ","   ","\t","\n","\r\n","\v","\f"," \t "):
    assert_error(a,q,errors.InvalidParameterValue,(blank_key,"cart-a","customer-a",1))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(blank_before,)]
# NULL mutation kind must fail closed, preserving route state and audit history.
mutate="SELECT ed_rpc_lab.mutate_context(%s,%s,%s,%s)"
before_route=run(None,"SELECT route_version,distance_km,expires_at FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")
before_audit=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")
assert_error(admin,mutate,errors.InvalidParameterValue,(None,"cart-a",before_route[0][0],5))
assert run(None,"SELECT route_version,distance_km,expires_at FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")==before_route
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==before_audit

# Warehouse updates are global; caller-supplied cart identifiers must not contaminate audit attribution.
warehouse_v=run(None,"SELECT version FROM ed_rpc_lab.warehouses WHERE singleton=true")[0][0]
audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")[0][0]
assert run(admin,mutate,("warehouse","cart-b",warehouse_v,None))==[(warehouse_v+1,)]
assert run(None,"SELECT change_kind,cart_id,previous_version,next_version FROM ed_rpc_lab.context_audit ORDER BY event_id DESC LIMIT 1")==[("warehouse",None,warehouse_v,warehouse_v+1)]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==[(audit_before+1,)]
assert run(None,"SELECT version FROM ed_rpc_lab.warehouses WHERE singleton=true")==[(warehouse_v+1,)]
# Restore route coherence for the subsequent context-race test suite, which
# shares this disposable database and starts by quoting the existing cart.
route_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
assert run(admin,mutate,("route","cart-a",route_v,5))==[(route_v+1,)]


print("PASS disposable PostgreSQL RPC, RLS, grants, manager isolation, admin-only tariff audit, idempotency and concurrency")
