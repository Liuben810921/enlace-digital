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

# Tariff versions are positive; reject malformed expected versions as invalid input
# rather than signaling a retryable optimistic-concurrency conflict.
invalid_rate_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
invalid_rate_audit=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")[0][0]
for invalid_expected in (0,-1,-9223372036854775808):
    assert_error(admin,u,errors.InvalidParameterValue,(invalid_expected,250,"Invalid expected version regression"))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==invalid_rate_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==[(invalid_rate_audit,)]

# A nonpositive cart revision is an invalid API argument, not a stale snapshot.
# Fail before acquiring locks or persisting an idempotency operation.
invalid_revision_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for invalid_revision in (0,-1,-9223372036854775808):
    assert_error(a,q,errors.InvalidParameterValue,("invalid-revision-"+str(invalid_revision),"cart-a","customer-a",invalid_revision))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(invalid_revision_before,)]

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

# Unicode bidirectional formatting controls can spoof a stored tariff audit reason.
bidi_reason_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")[0]
bidi_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")[0][0]
for bidi_reason in ("valid\u202ereversed","valid\u202aembedded","valid\u2066isolate","valid\u2069end"):
    assert_error(admin,u,errors.InvalidParameterValue,(bidi_reason_before[0],275,bidi_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==[bidi_reason_before]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==[(bidi_audit_before,)]

# Embedded control characters can forge multi-line tariff audit narratives.
embedded_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
embedded_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for injected_reason in ("valid\nforged event","valid\rforged event","valid\tforged event"):
    assert_error(admin,u,errors.InvalidParameterValue,(embedded_before[0][0],275,injected_reason))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==embedded_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==embedded_audit_before

# Tiny positive rates can round to zero in numeric(12,2); reject before CHECK.
subcent_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")
subcent_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")
for tiny_rate in (__import__('decimal').Decimal('0.001'),__import__('decimal').Decimal('0.004')):
    assert_error(admin,u,errors.InvalidParameterValue,(subcent_before[0][0],tiny_rate,"Tarifa inferior al centavo"))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==subcent_before
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==subcent_audit_before

# A tariff update that rounds to the stored rate must not bump version or create a misleading audit.
noop_before=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")[0]
noop_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")[0][0]
for noop_rate in (noop_before[1],noop_before[1]+__import__('decimal').Decimal('0.004')):
    assert_error(admin,u,errors.InvalidParameterValue,(noop_before[0],noop_rate,"Tarifa sin cambio efectivo"))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==[noop_before]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==[(noop_audit_before,)]

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

# Bidirectional formatting controls can visually spoof an operation key.
bidi_key_before=run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")[0][0]
for bidi_key in ("order\u202eforged","order\u202aforged","order\u2066forged","order\u2069forged"):
    assert_error(a,q,errors.InvalidParameterValue,(bidi_key,"cart-a","customer-a",1))
assert run(a,"SELECT count(*) FROM ed_rpc_lab.quotes")==[(bidi_key_before,)]

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

# A distance is meaningful only for a route mutation. Reject extraneous
# distances instead of silently committing a different context operation.
extra_distance_cart_v=run(None,"SELECT revision,destination_version FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0]
extra_distance_wh_v=run(None,"SELECT version FROM ed_rpc_lab.warehouses WHERE singleton=true")[0][0]
extra_distance_audit=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")[0][0]
for kind,expected in (("cart",extra_distance_cart_v[0]),("destination",extra_distance_cart_v[1]),("warehouse",extra_distance_wh_v)):
    assert_error(admin,mutate,errors.InvalidParameterValue,(kind,"cart-a",expected,5))
assert run(None,"SELECT revision,destination_version FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")==[extra_distance_cart_v]
assert run(None,"SELECT version FROM ed_rpc_lab.warehouses WHERE singleton=true")==[(extra_distance_wh_v,)]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==[(extra_distance_audit,)]

# Warehouse updates are global; caller-supplied cart identifiers must not contaminate audit attribution.
warehouse_v=run(None,"SELECT version FROM ed_rpc_lab.warehouses WHERE singleton=true")[0][0]
audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")[0][0]
assert run(admin,mutate,("warehouse","cart-b",warehouse_v,None))==[(warehouse_v+1,)]
assert run(None,"SELECT change_kind,cart_id,previous_version,next_version FROM ed_rpc_lab.context_audit ORDER BY event_id DESC LIMIT 1")==[("warehouse",None,warehouse_v,warehouse_v+1)]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==[(audit_before+1,)]
assert run(None,"SELECT version FROM ed_rpc_lab.warehouses WHERE singleton=true")==[(warehouse_v+1,)]
# A positive route distance must not silently round to zero in numeric(10,2).
route_precision_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
route_precision_audit=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")[0][0]
for tiny_distance in (__import__('decimal').Decimal('0.001'),__import__('decimal').Decimal('0.004')):
    assert_error(admin,mutate,errors.InvalidParameterValue,("route","cart-a",route_precision_v,tiny_distance))
assert run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")==[(route_precision_v,)]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==[(route_precision_audit,)]

# Boundary audit: invalid non-finite/out-of-range distances must not mutate routes.
# The smallest positive value representable at two decimals (0.005 -> 0.01)
# is deliberately tested separately from the rejected positive-to-zero values.
route_bounds_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
route_bounds_audit=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")[0][0]
for invalid_distance in (__import__('decimal').Decimal('NaN'),__import__('decimal').Decimal('Infinity'),
                         __import__('decimal').Decimal('-Infinity'),__import__('decimal').Decimal('-0.001'),
                         __import__('decimal').Decimal('10000.001')):
    assert_error(admin,mutate,errors.InvalidParameterValue,("route","cart-a",route_bounds_v,invalid_distance))
assert run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")==[(route_bounds_v,)]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==[(route_bounds_audit,)]

# Precision boundary: 0.005 km must round up to 0.01 km, never to zero.
# This is a valid positive route update, followed by an explicit zero route.
precision_boundary_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
assert run(admin,mutate,("route","cart-a",precision_boundary_v,__import__('decimal').Decimal('0.005')))==[(precision_boundary_v+1,)]
assert run(None,"SELECT distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")==[(__import__('decimal').Decimal('0.01'),)]
assert run(admin,mutate,("route","cart-a",precision_boundary_v+1,__import__('decimal').Decimal('0')))==[(precision_boundary_v+2,)]
assert run(None,"SELECT distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")==[(__import__('decimal').Decimal('0.00'),)]

# Restore route coherence for the subsequent context-race test suite, which
# shares this disposable database and starts by quoting the existing cart.
route_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
assert run(admin,mutate,("route","cart-a",route_v,5))==[(route_v+1,)]


# Zero-distance route must still honor the configured minimum distance and fee.
# Use a new operation key and restore the route fixture after this quote.
zero_route_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
assert run(admin,mutate,("route","cart-a",zero_route_v,0))==[(zero_route_v+1,)]
zero_settings=run(None,"SELECT rate_cup_per_km,min_km,min_fee_cup FROM ed_rpc_lab.settings WHERE singleton=true")[0]
from decimal import Decimal
zero_expected=max(int((zero_settings[0]*zero_settings[1]).to_integral_value(rounding='ROUND_CEILING')),zero_settings[2])
zero_revision=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
zero_quote=run(a,q,("zero-distance-minimum","cart-a","customer-a",zero_revision))
assert zero_quote==[("committed",zero_expected,zero_expected,0)],zero_quote
assert run(a,q,("zero-distance-minimum","cart-a","customer-a",zero_revision))==[("replayed",zero_expected,zero_expected,0)]
assert run(admin,mutate,("route","cart-a",zero_route_v+1,5))==[(zero_route_v+2,)]

# Free-delivery threshold is inclusive: equality must be free, one cent below paid.
# Fixture-only changes are made by the disposable database superuser and restored.
threshold=run(None,"SELECT free_threshold_usd FROM ed_rpc_lab.settings WHERE singleton=true")[0][0]
original_subtotal=run(None,"SELECT subtotal_usd FROM ed_rpc_lab.carts WHERE cart_id='cart-b'")[0][0]
threshold_rev=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-b'")[0][0]
# Earlier warehouse mutation invalidates cart-b route: refresh its snapshot first.
threshold_route_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-b'")[0][0]
threshold_distance=run(None,"SELECT distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-b'")[0][0]
assert run(admin,mutate,("route","cart-b",threshold_route_v,threshold_distance))==[(threshold_route_v+1,)]
try:
    run(None,"UPDATE ed_rpc_lab.carts SET subtotal_usd=%s WHERE cart_id='cart-b' RETURNING subtotal_usd",(threshold,))
    at_threshold=run(b,q,("threshold-exact","cart-b","customer-b",threshold_rev))
    assert at_threshold[0][0]=="committed" and at_threshold[0][1]>0 and at_threshold[0][2:]==(0,at_threshold[0][1]),at_threshold
    assert run(b,q,("threshold-exact","cart-b","customer-b",threshold_rev))==[("replayed",at_threshold[0][1],0,at_threshold[0][1])]
    run(None,"UPDATE ed_rpc_lab.carts SET subtotal_usd=%s WHERE cart_id='cart-b' RETURNING subtotal_usd",(threshold-Decimal("0.01"),))
    below_threshold=run(b,q,("threshold-below","cart-b","customer-b",threshold_rev))
    assert below_threshold==[("committed",at_threshold[0][1],at_threshold[0][1],0)],below_threshold
finally:
    run(None,"UPDATE ed_rpc_lab.carts SET subtotal_usd=%s WHERE cart_id='cart-b' RETURNING subtotal_usd",(original_subtotal,))

# Tariff rounding and minimum-fee dominance: a fractional positive CUP fee
# rounds upward; a larger configured minimum fee takes precedence.
# These settings are temporary fixtures in disposable PostgreSQL only.
rounding_settings=run(None,"SELECT min_km,min_fee_cup FROM ed_rpc_lab.settings WHERE singleton=true")[0]
rounding_route_v=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
assert run(admin,mutate,("route","cart-a",rounding_route_v,Decimal("0.01")))==[(rounding_route_v+1,)]
rounding_rev=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
try:
    run(None,"UPDATE ed_rpc_lab.settings SET min_km=0,min_fee_cup=0 WHERE singleton=true RETURNING min_km")
    rounding_quote=run(a,q,("ceil-fractional-cup","cart-a","customer-a",rounding_rev))
    rounding_rate=run(None,"SELECT rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")[0][0]
    rounded_up=int((Decimal("0.01")*rounding_rate).to_integral_value(rounding="ROUND_CEILING"))
    assert rounding_quote==[("committed",rounded_up,rounded_up,0)],rounding_quote
    run(None,"UPDATE ed_rpc_lab.settings SET min_fee_cup=%s WHERE singleton=true RETURNING min_fee_cup",(rounded_up+17,))
    min_dominates=run(a,q,("minimum-dominates","cart-a","customer-a",rounding_rev))
    assert min_dominates==[("committed",rounded_up+17,rounded_up+17,0)],min_dominates
finally:
    run(None,"UPDATE ed_rpc_lab.settings SET min_km=%s,min_fee_cup=%s WHERE singleton=true RETURNING min_km",(rounding_settings[0],rounding_settings[1]))
    run(admin,mutate,("route","cart-a",rounding_route_v+1,5))

# Regression: no hard-coded fee floor when route and both configured minima are zero.
prior_floors=run(None,"SELECT min_km,min_fee_cup FROM ed_rpc_lab.settings WHERE singleton=true")[0]
prior_route=run(None,"SELECT route_version,distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0]
try:
    assert run(admin,mutate,("route","cart-a",prior_route[0],Decimal("0")))==[(prior_route[0]+1,)]
    run(None,"UPDATE ed_rpc_lab.settings SET min_km=0,min_fee_cup=0 WHERE singleton=true RETURNING min_km")
    rev=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
    quote=run(a,q,("zero-no-floors","cart-a","customer-a",rev))
    assert quote==[("committed",0,0,0)],quote
    assert run(a,q,("zero-no-floors","cart-a","customer-a",rev))==[("replayed",0,0,0)]
finally:
    run(None,"UPDATE ed_rpc_lab.settings SET min_km=%s,min_fee_cup=%s WHERE singleton=true RETURNING min_km",prior_floors)
    latest_route=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
    run(admin,mutate,("route","cart-a",latest_route,prior_route[1]))

# Minimum-distance boundary: below and equal to min_km use the same fee,
# while a route one stored centimeter above it must use actual distance.
min_boundary_settings=run(None,"SELECT min_km,min_fee_cup,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")[0]
min_boundary_route=run(None,"SELECT route_version,distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0]
min_boundary_rev=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
try:
    min_km,min_fee,rate=min_boundary_settings
    assert min_km>=Decimal("0.01")
    expected_floor=max(int((min_km*rate).to_integral_value(rounding="ROUND_CEILING")),min_fee)
    for label,distance in (("below",min_km-Decimal("0.01")),("equal",min_km),("above",min_km+Decimal("0.01"))):
        version=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
        assert run(admin,mutate,("route","cart-a",version,distance))==[(version+1,)]
        expected=max(int((max(distance,min_km)*rate).to_integral_value(rounding="ROUND_CEILING")),min_fee)
        result=run(a,q,("min-km-"+label,"cart-a","customer-a",min_boundary_rev))
        assert result==[("committed",expected,expected,0)],(label,result,expected)
        if label!="above": assert expected==expected_floor
finally:
    latest_version=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
    run(admin,mutate,("route","cart-a",latest_version,min_boundary_route[1]))

# Exact minimum-fee crossover: one CUP below, equal to, and one CUP above
# the distance-derived fee must yield the expected maximum without off-by-one.
fee_crossover_original=run(None,"SELECT min_fee_cup,min_km,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")[0]
fee_crossover_route=run(None,"SELECT route_version,distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0]
fee_crossover_rev=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
fee_crossover_base=int((max(fee_crossover_route[1],fee_crossover_original[1])*fee_crossover_original[2]).to_integral_value(rounding="ROUND_CEILING"))
assert fee_crossover_base>=1
try:
    for label,minimum in (("below",fee_crossover_base-1),("equal",fee_crossover_base),("above",fee_crossover_base+1)):
        run(None,"UPDATE ed_rpc_lab.settings SET min_fee_cup=%s WHERE singleton=true RETURNING min_fee_cup",(minimum,))
        expected=max(fee_crossover_base,minimum)
        result=run(a,q,("fee-crossover-"+label,"cart-a","customer-a",fee_crossover_rev))
        assert result==[("committed",expected,expected,0)],(label,result,expected)
finally:
    run(None,"UPDATE ed_rpc_lab.settings SET min_fee_cup=%s WHERE singleton=true RETURNING min_fee_cup",(fee_crossover_original[0],))

# Tariff upper-bound regression: reject a rate above 100000 without
# changing settings/audit; accept the exact cap and quote deterministically.
cap_before=run(None,"SELECT version,rate_cup_per_km,min_km,min_fee_cup FROM ed_rpc_lab.settings WHERE singleton=true")[0]
cap_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.audit")[0][0]
assert_error(admin,u,errors.InvalidParameterValue,(cap_before[0],Decimal("100000.01"),"Tarifa superior al limite"))
assert run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")==[(cap_before[0],cap_before[1])]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.audit")==[(cap_audit_before,)]
try:
    assert run(admin,u,(cap_before[0],Decimal("100000"),"Tarifa maxima permitida"))==[(cap_before[0]+1,)]
    cap_distance=run(None,"SELECT distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
    cap_revision=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
    cap_expected=max(int((max(cap_distance,cap_before[2])*Decimal("100000")).to_integral_value(rounding="ROUND_CEILING")),cap_before[3])
    cap_quote=run(a,q,("tariff-exact-cap","cart-a","customer-a",cap_revision))
    assert cap_quote==[("committed",cap_expected,cap_expected,0)],cap_quote
finally:
    cap_current=run(None,"SELECT version,rate_cup_per_km FROM ed_rpc_lab.settings WHERE singleton=true")[0]
    if cap_current[1]!=cap_before[1]:
        assert run(admin,u,(cap_current[0],cap_before[1],"Restaurar tarifa sintetica"))==[(cap_current[0]+1,)]

# Maximum route-distance boundary: reject a distance beyond 10000 km
# without changing route versions/audit, and quote at the exact maximum.
max_route_before=run(None,"SELECT route_version,distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0]
max_route_audit_before=run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")[0][0]
assert_error(admin,mutate,errors.InvalidParameterValue,("route","cart-a",max_route_before[0],Decimal("10000.01")))
assert run(None,"SELECT route_version,distance_km FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")==[max_route_before]
assert run(None,"SELECT count(*) FROM ed_rpc_lab.context_audit")==[(max_route_audit_before,)]
try:
    assert run(admin,mutate,("route","cart-a",max_route_before[0],Decimal("10000")))==[(max_route_before[0]+1,)]
    max_route_rev=run(None,"SELECT revision FROM ed_rpc_lab.carts WHERE cart_id='cart-a'")[0][0]
    max_route_rate=run(None,"SELECT rate_cup_per_km,min_fee_cup FROM ed_rpc_lab.settings WHERE singleton=true")[0]
    max_route_expected=max(int((Decimal("10000")*max_route_rate[0]).to_integral_value(rounding="ROUND_CEILING")),max_route_rate[1])
    max_route_quote=run(a,q,("route-exact-max","cart-a","customer-a",max_route_rev))
    assert max_route_quote==[("committed",max_route_expected,max_route_expected,0)],max_route_quote
finally:
    max_route_current=run(None,"SELECT route_version FROM ed_rpc_lab.routes WHERE cart_id='cart-a'")[0][0]
    if max_route_current!=max_route_before[0]:
        assert run(admin,mutate,("route","cart-a",max_route_current,max_route_before[1]))==[(max_route_current+1,)]

print("PASS disposable PostgreSQL RPC, RLS, grants, manager isolation, admin-only tariff audit, idempotency and concurrency")
