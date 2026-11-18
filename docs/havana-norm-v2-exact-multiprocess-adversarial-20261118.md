# NORM-v2: exact base test, multiprocess, adversarial JSON and legacy coexistence — 2026-11-18

Base `4c800b15b48d1a9d1edae1f49d6eb2f411ab8924`; branch `plan/havana-osrm-benchmark-offline-20261114`. No production or external service access.

## Actual Node execution
- Recovered the three published NORM-v2 files via GitHub connector and reconstructed them in `/mnt/data/ed-normv2-exact` (network download to container unavailable: DNS failure). Executed `node idempotency-norm-v2.test.mjs` on Node v22.16.0: **PASS 29 NORM-v2 GitHub assertions** (exit 0). Text manually reconstructed from exact connector content; no independent byte-for-byte SHA comparison.
- Extended locally with `adversarial.test.mjs`: first run FAILED on JSON `{"x":1e9999}` because `JSON.parse` returns Infinity. Fixed only reproduced defect: after JSON parsing, reject nonfinite numeric values. Commit `1a298fa580f146e0e4e9b33435cf3a8430853f9b`.
- Re-run local adversarial suite: **PASS 19 adversarial assertions; 20 processes 1 reserved, 19 pending; legacy and v2 tables coexist** (exit 0). The new GitHub adversarial test was transcribed separately and **not executed as an exact downloaded blob**; its code was published in commit `bcbe2d14b84fb65d6f3ed2028025bf91be44a746`.

## Confirmed behaviors
- 20 independent Node processes race on one SQLite file and one NORM-v2 operation: one reserves; 19 get in-progress; no duplicated credit in that race.
- JSON duplicate keys, NFC-equivalent keys, malformed JSON and overflow exponent are rejected in local tests.
- NORM-v2 and legacy tables can coexist in one synthetic SQLite file without changing legacy schema.

## Important limitation / NO-GO
- **Coexistence is not safe for a shared real provider quota:** legacy `quotas` and v2 `quota_v2` track usage separately. If both were active, they could collectively exceed provider budget. No simultaneous real use or rollout without a single shared quota coordinator and explicit version migration plan.
- NORM-v2 uses synthetic identity passed by caller; it is not authenticated. Parser is handwritten, needs fuzzing and input-size/canonicalization integration tests. Unicode surrogate edge cases and JSON escaping remain to test.
- Node SQLite multiprocess does not certify Cloudflare Durable Objects runtime; Cloudflare requires its own `ctx.storage.transactionSync()` or transaction APIs: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- No actual provider routing calls, credentials, account creation, deployment, GitHub Actions, Supabase, staging, production, customer data or orders.

## Next verification
Run exact new adversarial GitHub blob and original 29 assertions after the parser patch, then design unified quota accounting for version compatibility, strictly offline. Do not deploy.
