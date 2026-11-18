# SQLite quota laboratory: local verification and scope (2026-11-18)

Base `d7c03305a72edb42930883969062d2faea7f4bf2`; isolated branch `plan/havana-osrm-benchmark-offline-20261114`.

## Actual execution in temporary local environment
Node v22.16.0 with experimental `node:sqlite`:
- Existing adapter v2: `PASS 42 offline assertions`.
- Existing proxy offline: `PASS 12 proxy assertions; concurrent accepted 2/30, rejected 28/30`.
- New SQLite local model: initial test FAILED due to `DatabaseSync` returning a null-prototype row; corrected by normalizing the `stats()` output to a plain object. Re-run: `PASS 16 SQLite offline assertions; concurrency 2/30 accepted, 28/30 denied`.
- Local prototype hashes: `durable-sqlite.mjs` SHA-256 `b1bf50717e91c16be274b219f9dc46313d37ed2137a6085ff922afab339060c6`; `durable-sqlite.test.mjs` SHA-256 `d71e089684a978219bf26c11e9fe961b07a3a75725dc0d5307b890d0be7f270a`.

## Published artifacts and verification boundary
The published GitHub `experiments/geoapify-offline/durable-sqlite.mjs` and `durable-sqlite.test.mjs` are a **slightly simplified transcription** of the locally executed files (not byte-for-byte identical). The local execution above validates the local model, **not an exact Node execution of the published GitHub blobs**. The published test can be run in a Node 22 environment with `node --disable-warning=ExperimentalWarning experiments/geoapify-offline/durable-sqlite.test.mjs`. Do not claim the published test has been independently executed until fetched and run.

## Design and limitations
- SQLite `BEGIN IMMEDIATE` protects the quota row, nonce replay, and reservation within a single database; on unknown provider outcome, reserved credits are conservatively charged.
- Synthetic HMAC session verifies a signature and expiry, but is **not** integration with production login or a substitute for authorization and real user identities. Nonce storage grows indefinitely; production needs retention policy without reopening replay attacks.
- **Node DatabaseSync is not the Cloudflare Durable Objects SQLite API**. This is an offline behavioral model, not a deployable Worker. A Durable Object's single-threaded coordination and storage transactions require Cloudflare-specific code and isolated tests.
- The concurrency test uses `Promise.all` on synchronous transactions in one Node event loop; it does not demonstrate independent processes or geographically distributed concurrency.
- Critical pending cases: cross-day replay policy, crash after provider request, storage failure, session revocation, user-level rate limits, trusted origin, authentication binding, idempotency and reconciliation of credits.
- No network, keys, accounts, deployments, external calls, costs, GitHub Actions, Supabase, staging, production, or orders. Real routes: 0.

## Next gate
Before any activation, implement a Cloudflare-specific Worker+Durable Object design with secrets, authenticated sessions, atomic quotas, and failure recovery, and verify eligibility and zero-cost limits. Do not expose keys in GitHub Pages.
