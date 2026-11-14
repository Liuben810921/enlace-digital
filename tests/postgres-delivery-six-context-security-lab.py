#!/usr/bin/env python3
"""Disposable SQL security, RLS, rollback and concurrent optimistic-retry tests."""
import concurrent.futures
import psycopg
from psycopg import errors
BASE="host=127.0.0.1 port=5432 dbname=postgres connect_timeout=5"
def db(role="postgres",transaction=False):
 return psycopg.connect(BASE+(" user=postgres password=postgres" if role=="postgres" else f" user={role} password=disposable-race-only"),autocommit=not transaction)
def run(role,sql,args=()):
 with db(role) as c:return c.execute(sql,args).fetchall()
a="ed_race_manager_a";b="ed_race_manager_b"
with db(a) as c:
 c.execute("INSERT INTO ed_quote_race.manager_quotes VALUES('a-quote',%s,'fictional-cart-a','prepared')",(a,))
with db(b) as c:
 c.execute("INSERT INTO ed_quote_race.manager_quotes VALUES('b-quote',%s,'fictional-cart-b','prepared')",(b,))
assert run(a,"SELECT quote_id FROM ed_quote_race.manager_quotes")==[("a-quote",)]
assert run(b,"SELECT quote_id FROM ed_quote_race.manager_quotes")==[("b-quote",)]
for role,foreign in ((a,b),(b,a)):
 try:run(role,"INSERT INTO ed_quote_race.manager_quotes VALUES('forbidden',%s,'fictional-cart-a','prepared')",(foreign,))
 except errors.InsufficientPrivilege:pass
 else:raise AssertionError("RLS insert permitted foreign owner")
 assert run(role,"SELECT count(*) FROM ed_quote_race.manager_quotes WHERE manager_role=%s",(foreign,))==[(0,)]
 for stmt in ("SELECT * FROM ed_quote_race.audit","UPDATE ed_quote_race.context SET cart_version=99 WHERE id='fictional-cart-a'","SELECT * FROM ed_quote_race.quotes"):
  try:run(role,stmt)
  except errors.InsufficientPrivilege:pass
  else:raise AssertionError("excess privileges: "+stmt)
# Transaction rollback must not advance versions or persist a quote.
with db() as c:
 before=c.execute("SELECT cart_version FROM ed_quote_race.context WHERE id='fictional-cart-a'").fetchone()[0]
with db(transaction=True) as c:
 c.execute("SELECT ed_quote_race.mutate('fictional-cart-a','cart')")
 c.execute("SELECT ed_quote_race.prepare('rolled-back','fictional-cart-a')")
 c.rollback()
with db() as c:
 assert c.execute("SELECT cart_version FROM ed_quote_race.context WHERE id='fictional-cart-a'").fetchone()[0]==before
 assert c.execute("SELECT count(*) FROM ed_quote_race.quotes WHERE id='rolled-back'").fetchone()[0]==0
# Concurrent optimistic attempts: expected version condition admits exactly one update.
def compare_and_swap():
 with db() as c:
  return c.execute("UPDATE ed_quote_race.context SET tariff_version=tariff_version+1 WHERE id='fictional-cart-a' AND tariff_version=%s RETURNING tariff_version",(initial,)).fetchone()
with db() as c:initial=c.execute("SELECT tariff_version FROM ed_quote_race.context WHERE id='fictional-cart-a'").fetchone()[0]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 results=list(pool.map(lambda _:compare_and_swap(),range(2)))
assert sum(x is not None for x in results)==1,results
with db() as c:
 assert c.execute("SELECT tariff_version FROM ed_quote_race.context WHERE id='fictional-cart-a'").fetchone()[0]==initial+1
# A fresh attempt can retry using the new version; a stale quote must reject.
with db() as c:c.execute("SELECT ed_quote_race.prepare('retry-stale','fictional-cart-a')")
with db() as c:c.execute("SELECT ed_quote_race.mutate('fictional-cart-a','warehouses')")
with db() as c:assert c.execute("SELECT ed_quote_race.confirm('retry-stale')").fetchone()[0]=="stale"
with db() as c:
 c.execute("SELECT ed_quote_race.prepare('retry-fresh','fictional-cart-a')")
 assert c.execute("SELECT ed_quote_race.confirm('retry-fresh')").fetchone()[0]=="confirmed"
print("PASS disposable RLS manager isolation, least privilege, rollback, optimistic conflict, retry and stale rejection")
