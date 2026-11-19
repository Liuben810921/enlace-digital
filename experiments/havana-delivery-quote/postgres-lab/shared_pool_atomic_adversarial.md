# Atomic linkage adversarial plan — NOT EXECUTED
1. Missing context singleton => PENDIENTE, no consumed_at.
2. Wrong context hash/revision => PENDIENTE, no approval or consumption.
3. Supervisor/disabled administrator => PENDIENTE.
4. Wrong nonce/expired/replayed intent => PENDIENTE.
5. Same operation with changed fee/hash/revision => PENDIENTE, no overwrite.
6. Two concurrent sessions apply same intent => one LAB_APPLIED_ONLY, one PENDIENTE; one approval.
7. Revoke approval owned by different actor => PENDIENTE.
8. Revoked or expired approval replay => PENDIENTE.
9. Exception after approval insert before intent update => transaction rollback both changes.
10. Direct table mutation by pool role => permission denied.
11. Prior standalone consume by pool => permission denied after new script.
12. Gateway forged actor or wrong snapshot => cannot be proven by SQL prototype; gateway trust is mandatory.
13. Reconnect and retry after unknown commit => inspect durable state through trusted gateway, no second charge.
14. Revocation races resolution => not solved at checkout handoff; final atomic use check required.

All expected outcomes, not observed. Must execute in disposable PostgreSQL with two connections before any security claim.
