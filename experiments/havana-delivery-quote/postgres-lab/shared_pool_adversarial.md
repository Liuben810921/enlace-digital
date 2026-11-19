# Adversarial test matrix — NOT EXECUTED
1. Forged actor ID, forged role, forged client fingerprint: gateway rejects before database.
2. Pool LOGIN `session_user` used as admin identity: rejected; generic pool cannot execute legacy approval RPC.
3. Browser sets arbitrary custom GUC or SET ROLE: no authority to create server intent.
4. Reuse intent nonce across different actor, action, context, fee or audience: reject.
5. Replay same operation ID and identical payload after network timeout: same persisted result, never second approval.
6. Same operation ID with different fee/context: CONFLICT/PENDIENTE, never overwrite.
7. Two sessions consume same intent concurrently: exactly one consumption; loser returns safe replay or PENDIENTE.
8. Revocation races resolution: lock order consistent; final use requires fresh atomic validation.
9. Admin role revoked while intent is outstanding: reject on transaction.
10. Context changes while intent is outstanding: reject on transaction.
11. Expiry, missing intent, unknown commit, DB restart: fail closed and idempotent retry.
12. Direct table SELECT/INSERT/UPDATE by pool role: denied.
These are required future tests, not passing assertions or verified production behavior.
