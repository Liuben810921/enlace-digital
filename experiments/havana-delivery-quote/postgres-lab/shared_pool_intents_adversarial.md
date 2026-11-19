# Disposable PostgreSQL adversarial test matrix — NOT EXECUTED

Preconditions: disposable database, DBA-provisioned separate gateway and pool LOGIN roles with no cross-membership. Install schema only in that disposable database.

1. Pool attempts INSERT/UPDATE/SELECT on intents: permission denied.
2. Pool attempts SET ROLE gateway or owner: permission denied.
3. Gateway attempts consume: permission denied; gateway can INSERT only.
4. Pool invokes consume with missing, invalid or wrong nonce hash: PENDIENTE.
5. Pool invokes consume with expired or future-issued intent: PENDIENTE.
6. Two independent pool sessions consume same intent concurrently: exactly one LAB_CONSUMED_ONLY; other PENDIENTE.
7. Replay after commit and reconnect: PENDIENTE; consumed_at persists.
8. Duplicate nonce or (actor,operation,action): uniqueness violation, no overwrite.
9. Malformed action, audience, context, revision, fee or target: CHECK violation.
10. Revoke intent cannot carry fee; approve intent cannot carry target ID.
11. Gateway inserts forged actor while compromised: SQL cannot detect it; gateway authentication is mandatory.
12. Unknown transaction commit: reconcile consumed state through trusted backend, never treat a retry as fresh authorization.
13. Direct use of consumed intent to approve/revoke or charge: impossible in this prototype; no such RPC exists.

These are future expected outcomes, NOT measured test results. A PostgreSQL pool role with gateway credentials is outside this separation and invalidates the security model.
