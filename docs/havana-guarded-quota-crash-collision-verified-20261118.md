# ENLACE DIGITAL — coordinador protegido, colisiones y recuperación offline (2026-11-18)

Base `660f08010b9b38fadb44347d373026c2a4e50e6d`, rama `plan/havana-osrm-benchmark-offline-20261114`.

## Ejecución exacta del código previamente publicado
Se recuperaron `unified-guarded.mjs`, `unified-guarded.test.mjs`, `unified-guarded.race.test.mjs`, `shared-quota.mjs` e `idempotency-norm-v2.mjs` por el conector GitHub. Se reconstruyeron localmente y verificaron con `git hash-object`, coincidiendo con los blobs remotos:
- `unified-guarded.mjs` `e67b366bdc12a10361445789174b3044a6fa36ab`
- `unified-guarded.test.mjs` `e1d9f5bbba988eedaa2d21f9cdc4604e87f7dacf`
- `unified-guarded.race.test.mjs` `2df854e5e24b5bad36ae1f11bbd00322a1e7f19b`
- `shared-quota.mjs` `54716ee0996a9e074a7631dc3b1765377554858f`
- `idempotency-norm-v2.mjs` `38499d106fe0f4ef447f1e9659f67bd22e9de6cb`

Node v22.16.0:
```
PASS 15 guarded quota assertions
PASS 3 guarded race assertions; 24 processes, 3 reserved, 21 quota
```
Exit code 0 for both. These tests **do execute byte-identical copies of the previously published Git blobs**. No bug was reproduced in the guarded implementation, so it was not modified.

## Expanded local tests
New test files published:
- `unified-guarded.faults.test.mjs` (Git blob `d83865b94ea929e3201ac2a75a2bb67439c582ae`)
- `unified-guarded.collision.test.mjs` (Git blob `a94cb296785bbf2d3ac32c1be7abcfd379a8618d`)

Local executions, with exact guarded implementation:
```
PASS 12 guarded crash and identity assertions
PASS 3 global-collision assertions; 24 processes, one reservation
```
The local test source hashes differ from the newly published test blobs (local faults `972599ccb34cfb27d037104b00f2013f1406b297`, local collision `a09e05fc39c622e24ff6d699f963ff0820ca5723`). These two tests therefore **are not yet certified as byte-identical to the new GitHub test files**, despite matching intended scenarios. Rerun their exact Git blobs next.

## Failure semantics
- Simulated process exit while an SQLite transaction remains open: SQLite rolls back uncommitted changes after process termination.
- Simulated process exit after a completed reservation: reopening sees the reserved operation, so no duplicate credit is reserved.
- Simulated process exit with uncommitted settlement: reopening sees the original reservation and a subsequent valid settlement consumes once.
- 24 independent processes racing the same global operation ID, with different versions/principals/payloads: one reservation, 23 conflicts or already-tracked, quota reserved 1.
- Synthetic principal mismatch at finish returns conflict, no change to quota.
- This is a **process.exit simulation**, not actual SIGKILL, power failure, disk corruption or provider-call uncertainty. The tests do not prove durability under physical failure.

## Security boundaries / NO-GO
- Principal remains caller-supplied synthetic data, **not authenticated**. Real authorization requires a trusted server principal.
- The coordinator is isolated and cannot enforce that legacy and NORM-v2 callers stop using their original counters; those direct paths must be disabled or mediated before integration.
- No services, GitHub Actions, accounts, keys, deployments, Supabase, staging, production, customers or orders touched.
- Node v22 `node:sqlite` is experimental; the Node.js API documentation confirms synchronous database operations: https://nodejs.org/api/sqlite.html

## Next step
Verify exact Git blobs of the two new test files and rerun. Add process SIGKILL and injected failures around BEGIN/COMMIT plus atomic invariant auditing, all offline.
