#!/usr/bin/env python3
"""Disposable PG16: contrast interrupted COMMIT rollback with durable COMMIT response loss."""
import psycopg
ADMIN="host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres connect_timeout=5"
CLIENT="host=127.0.0.1 port=5432 dbname=postgres user=ed_integrated_a password=synthetic-a connect_timeout=5"
RPC="SELECT ed_integrated_lab.commit_bundle(%s,%s,%s,%s,%s,%s)"
def call(c,key,product,revision):
 return c.execute(RPC,(key,product,"s",["w1","w2"],"proveedor",revision)).fetchone()[0]
def state(key,product):
 with psycopg.connect(ADMIN) as c:
  return (c.execute("SELECT count(*) FROM ed_integrated_lab.operations WHERE tenant='a' AND op=%s",(key,)).fetchone()[0],
          c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id=%s",(product,)).fetchone()[0],
          c.execute("SELECT revision FROM ed_integrated_lab.versions WHERE tenant='a'").fetchone()[0])
# Prior script terminates backend inside deferred COMMIT, verifies rollback and
# recovers the same operation. This independently checks its durable final state.
assert state("during-commit","during-commit-product")==(1,1,13)
with psycopg.connect(CLIENT) as c:
 assert call(c,"during-commit","during-commit-product",12)["replayed"] is True
print("PASS interrupted-COMMIT rollback reconciled once; previous laboratory outcome retained")
# Distinct controlled case: COMMIT is durable, but the application discards
# its success result, closes the client connection, and treats outcome as unknown.
# This is not a claim that a TCP ACK was lost while PostgreSQL committed.
key="durable-no-response"
product="durable-no-response-product"
c=psycopg.connect(CLIENT)
try:
 assert call(c,key,product,13)["status"]=="draft"
 c.commit()
 # Intentionally discard the confirmed response from the application's perspective.
finally:
 c.close()
assert state(key,product)==(1,1,14)
with psycopg.connect(CLIENT) as c:
 recovered=call(c,key,product,13)
 assert recovered["replayed"] is True and recovered["revision"]==14
 conflict=call(c,key,"different-product",14)
 assert conflict["status"]=="idempotency_conflict"
assert state(key,product)==(1,1,14)
print("PASS durable COMMIT with application-discarded response and closed connection, same-key replay once")
with psycopg.connect(ADMIN) as c:
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE tenant='a' AND id IN (%s,%s)",("during-commit-product",product)).fetchone()[0]==2
 assert c.execute("SELECT count(*) FROM ed_integrated_lab.products WHERE published OR status<>'draft'").fetchone()[0]==0
 assert c.execute("SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='ed_integrated_lab'::regnamespace AND relkind='r'").fetchone()[0] is True
 assert c.execute("SELECT rolbypassrls FROM pg_roles WHERE rolname='ed_integrated_owner'").fetchone()[0] is False
 assert c.execute("SELECT prosecdef FROM pg_proc WHERE oid='ed_integrated_lab.commit_bundle(text,text,text,text[],text,bigint)'::regprocedure").fetchone()[0] is True
print("PASS both outcomes reconciled, no duplicate, CAS, FORCE RLS, SECURITY DEFINER NOBYPASSRLS, unpublished drafts")
