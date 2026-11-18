# ENLACE DIGITAL — verificación de blobs y cuota protegida offline (2026-11-18)

Base `9544578dc186d766751577cad0b2a4a78618877e`, rama `plan/havana-osrm-benchmark-offline-20261114`. GitHub compare confirmó rama idéntica al punto de partida.

## Hashes Git y ejecución exacta
Los siguientes archivos locales reconstruidos a partir del conector GitHub se compararon mediante `git hash-object` con el SHA de blob obtenido por `fetch_file`, y coincidieron:
- `idempotency-norm-v2.mjs` `38499d106fe0f4ef447f1e9659f67bd22e9de6cb`
- `idempotency-norm-v2.test.mjs` `ce7cc7d2384bd155c0b525875a37bac0b4ec7bfc`
- `strict-json-v2.mjs` `5d19b2a3018c9927e6ab91f6df6d691b96507c02`
- `idempotency-ledger.mjs` `593e7390e25499f2ad08628b7ad4cb5f3a57e8f2`
- `shared-quota.mjs` `54716ee0996a9e074a7631dc3b1765377554858f`
- `shared-quota.test.mjs` `6c82a864f6c10c9c6547ea36179a0b3c72d158cc`
- `unified-adapter.mjs` `7f467a88b6c684d22c93ad3845828b7ac59d1bc1`
- `unified-adapter.test.mjs` `1f641732659d8f0b06227362619238c8ce5daf61`
- `unified-adapter.race.test.mjs` `168bd982dc5287a4addb7b804f2cbd8675ba62c5`

Node v22.16.0, exit code 0:
```
PASS 29 NORM-v2 GitHub assertions
PASS 18 shared-quota assertions; 24 processes, 3 reserved, 21 quota
PASS 10 unified adapter assertions
PASS 3 unified adapter race assertions; 24 processes, 3 reserved, 21 quota
```
For the adapter, the initially reconstructed NORM-v2 helper was not byte-identical; it was replaced by the exact Git blob matching `38499d...`, and both adapter suites were rerun successfully.

The adversarial test was reconstructed with equivalent behavior but **its Git blob hash did not match**: GitHub `90dac915c4642acd30a832975f5041f3965317f4` versus local `2daea43f186729d73398de8c2c9d40dd0eaafa1e`. It executed `PASS 19 adversarial assertions; 20 processes 1 reserved, 19 pending`, but **cannot be certified as the exact GitHub test file**.

## New guarded coordinator
Published `unified-guarded.mjs`, `unified-guarded.test.mjs`, `unified-guarded.race.test.mjs`. Adds a global operation ID (not namespaced by version), identity+canonical payload hash, authorization check in `finish`, and shared quota reservation/settlement inside SQLite transactions. The older files remain untouched.

Local tests:
```
PASS 15 guarded quota assertions
PASS 3 guarded race assertions; 24 processes, 3 reserved, 21 quota
```
The published guarded test matched its local Git blob `e1d9f5bbba988eedaa2d21f9cdc4604e87f7dacf`. The guarded implementation **did not match byte-for-byte**: local `94f43fb1aba04346c15dc54f0b3b3d27919b4bd3` vs published `e67b366bdc12a10361445789174b3044a6fa36ab`; therefore these local tests do not certify the exact published implementation. The race test was transcribed into GitHub separately; blob equality remains to verify.

## Boundaries / NO-GO
- Identity is synthetic and supplied by caller; no authenticated principal or permission to settle exists yet. The code checks consistency, **not real authorization**.
- Legacy/NORM-v2 classes still have direct quota paths. The guarded coordinator is an alternative isolated module; **not mandatory** unless all other paths are removed or blocked at a trusted boundary.
- The guarded prototype uses one canonical hash across versions, deliberately not the legacy `JSON.stringify` hash; compatibility/migration of existing records is untested.
- An unknown provider outcome conservatively consumes a credit and remains `PENDIENTE`. Tests cover SQLite close/reopen, not physical crashes, disk corruption, power loss, or crash between network call and commit.
- GitHub cannot be accessed by DNS from the local container, so matching used Git object hashing on reconstructed text and connector blob SHAs, not direct git clone.
- Cloudflare SQLite DO transactions use `ctx.storage.transactionSync()` and `ctx.storage.sql.exec()`, not `BEGIN IMMEDIATE`: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- No GitHub Actions, accounts, keys, services, deployments, Supabase, staging, production, customers or orders were accessed or changed.

## Next safe step
Reconstruct the exact guarded implementation from its published GitHub blob and rerun all guarded tests. Then add explicit crash fault injection before/after transaction commit and tests of global ID collision under 20+ independent processes. Keep isolated.
