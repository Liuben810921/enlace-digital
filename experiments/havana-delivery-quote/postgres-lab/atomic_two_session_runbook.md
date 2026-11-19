# Disposable two-session test runbook — NOT EXECUTED

## Prerequisites
- PostgreSQL and psql installed **by the operator**, isolated local disposable database.
- DBA-created local login with membership in ed_intent_pool; activate with SET ROLE.
- Run manual_approval.sql, shared_pool_intents.sql, shared_pool_atomic_lab.sql, atomic_disposable_roles.sql, atomic_two_connections_setup.sql. For revocation also run atomic_revocation_fixture.sql.
- Do not run scripts against Supabase, staging or production. No network setup, passwords, or downloads in this task.

## Separate runs
1. Approval COMMIT: fixture synthetic-op-1. Start A_commit and B while A sleeps; A expects LAB_APPLIED_ONLY; B PENDIENTE.
2. Approval ROLLBACK: **reset database**; start A_rollback and B; A's result is rolled back, B expects LAB_APPLIED_ONLY.
3. Revocation COMMIT: reset database, seed revocation, run A_commit and B with revoke intent; A LAB_APPLIED_ONLY; B PENDIENTE.
4. Revocation ROLLBACK: reset database and seed revocation; A_rollback and B; B LAB_APPLIED_ONLY.
5. Replay: after committed result, repeat same intent, expect PENDIENTE. Test wrong nonce, wrong role, expired intent, mismatched context, other actor's approval and duplicate intent in isolated fixtures.
6. Verify postconditions as DBA, including exactly one intent consumed and one corresponding effect. Check permission assertions separately.

## Timing and failure controls
- The B process must start during A's 8-second sleep. A timer is not a synchronization primitive; if B starts too late, the run does not demonstrate blocking.
- In each psql process set ON_ERROR_STOP=1 and capture separate exit statuses and stdout. Never interpret a failed SQL command as a successful test unless the negative case explicitly expects that error.
- If A returns PENDIENTE, the fixture may have expired or be malformed; discard the run. If B also returns LAB_APPLIED_ONLY after A commits, stop: possible replay defect.
- A session must be run with the same intent ID and nonce in both connections. Never infer an ID from sequence order.
- A rollback result printed in the transaction is **not committed**; check durable database state.
- All results described here are expectations, not observed outcomes.
