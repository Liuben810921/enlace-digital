#!/usr/bin/env bash
set -euo pipefail
export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres PGPASSWORD=postgres PGDATABASE=postgres
psql -X -v ON_ERROR_STOP=1 -q -f tests/postgres-delivery-quote-lab.sql
sql(){ psql -X -v ON_ERROR_STOP=1 -Atqc "$1"; }
eq(){ [[ "$1" == "$2" ]] || { echo "FAIL expected [$2] got [$1]"; exit 1; }; }
# Two real client connections compete for the same idempotency key.
for i in $(seq 1 12); do
  (sql "SELECT outcome,amount,version FROM quote_lab.quote('gestor','same-$i','payload',700,1)" >"/tmp/quote-a-$i") &
  (sql "SELECT outcome,amount,version FROM quote_lab.quote('gestor','same-$i','payload',700,1)" >"/tmp/quote-b-$i") &
done
wait
eq "$(sql "SELECT count(*) FROM quote_lab.operations")" "12"
for i in $(seq 1 12); do
  for side in a b; do
    actual="$(cat "/tmp/quote-$side-$i")"
    [[ "$actual" == "committed|700|1" || "$actual" == "replayed|700|1" ]] || { echo "FAIL parallel result: $actual"; exit 1; }
  done
done
eq "$(sql "SELECT outcome,amount,version FROM quote_lab.quote('gestor','same-1','payload',999,1)")" "replayed|700|1"
# Unknown commit: client disconnects after server commit, retry discovers the committed row.
sql "SELECT outcome FROM quote_lab.quote('gestor','unknown','payload',800,1)" >/dev/null
eq "$(sql "SELECT outcome,amount FROM quote_lab.quote('gestor','unknown','payload',800,1)")" "replayed|800"
# Rollback does not retain the operation.
sql "BEGIN; SELECT outcome FROM quote_lab.quote('gestor','rolled-back','payload',600,1); ROLLBACK;" >/dev/null
eq "$(sql "SELECT count(*) FROM quote_lab.operations WHERE operation_key='rolled-back'")" "0"
eq "$(sql "SELECT outcome FROM quote_lab.quote('gestor','rolled-back','payload',600,1)")" "committed"
# Conflicting payload rejected without overwriting.
if sql "SELECT * FROM quote_lab.quote('gestor','same-1','different',1,1)" >/dev/null 2>&1; then echo "FAIL conflict accepted";exit 1;fi
# Simultaneous admin updates use optimistic version CAS.
(sql "SELECT quote_lab.change_threshold('admin-a',1,250)" > /tmp/admin-a 2>/tmp/admin-a-err && echo ok >/tmp/admin-a-status || echo fail >/tmp/admin-a-status) &
(sql "SELECT quote_lab.change_threshold('admin-b',1,300)" > /tmp/admin-b 2>/tmp/admin-b-err && echo ok >/tmp/admin-b-status || echo fail >/tmp/admin-b-status) &
wait
[[ "$(cat /tmp/admin-a-status)$(cat /tmp/admin-b-status)" == "okfail" || "$(cat /tmp/admin-a-status)$(cat /tmp/admin-b-status)" == "failok" ]] || { echo "FAIL admin race";exit 1; }
eq "$(sql "SELECT version FROM quote_lab.settings")" "2"
eq "$(sql "SELECT count(*) FROM quote_lab.audit WHERE version=2")" "1"
# Old-version quote/replay invalidated after settings update.
if sql "SELECT * FROM quote_lab.quote('gestor','same-1','payload',700,1)" >/dev/null 2>&1;then echo "FAIL stale replay";exit 1;fi
if sql "SELECT * FROM quote_lab.quote('gestor','new','payload',700,1)" >/dev/null 2>&1;then echo "FAIL stale quote";exit 1;fi
eq "$(sql "SELECT outcome FROM quote_lab.quote('gestor','new','payload',700,2)")" "committed"
echo "PASS PostgreSQL real concurrent sessions, idempotent rows, unknown commit retry, rollback, CAS tariff race, stale invalidation"
