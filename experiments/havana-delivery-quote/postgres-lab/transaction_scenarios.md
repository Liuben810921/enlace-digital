# Disposable PostgreSQL transaction scenarios (NOT EXECUTED)

Prerequisite: local PostgreSQL server and two or more separate sessions, a disposable database, and a server-trusted actor authorization layer. Neither is available in this environment. SQL schema is an inert contract, not a complete RPC implementation.

1. Two sessions approve identical `(actor_id, operation_id)` concurrently. Both begin, lock configuration, attempt insert; expect one persisted row, same ID on retry. Assert no duplicate.
2. Two sessions reuse operation ID with different fingerprint or fee. Expect conflict, no overwrite.
3. Session A locks approval for resolve, session B revokes it. Require serializable order and a final revalidation at commitment/checkout handoff; a read-only earlier check must not authorize payment after revocation.
4. Session A changes configuration revision while B approves old fingerprint. Lock same singleton configuration; expect old-context approval to be rejected or invalidated.
5. Disconnect/reconnect and restart database. Expect approval and revocation rows retained; operation retry remains idempotent.
6. Authenticated supervisor/gestor tries approval and revocation: reject; principal/general permitted only through server-authenticated RPC. Direct table writes denied.
7. Expiry based on database clock; attempts at boundary and after expiry return PENDIENTE.
8. Failures, deadlocks, timeouts and unknown commit: retry using identical operation ID; never charge twice.

This file is a test plan, NOT evidence of passing tests. Do not execute in staging/production.
