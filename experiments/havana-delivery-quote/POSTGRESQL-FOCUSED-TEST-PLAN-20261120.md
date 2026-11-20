# PostgreSQL focused verification plan — NOT EXECUTED

**Repository:** Liuben810921/enlace-digital  
**Branch:** `fix/delivery-batch-deactivation-order-20261120`  
**Baseline:** `7808e0f9ad3a33d05a5f6c5bb642873fd79d329a`  
**SQL under test:** `experiments/havana-delivery-quote/staging-delivery-schema.sql`

> DESIGN ONLY. Do not run against Supabase, staging, production or customer data. This file is a specification, not a migration or evidence of passing PostgreSQL tests. No SQL was applied while preparing it.

## Prerequisites / controlled environment

1. Obtain **separate authorization** for a disposable PostgreSQL environment and for running tests; do not use Supabase or production.
2. Confirm PostgreSQL version, availability of `auth.uid()` and `auth.users` test doubles, and permissions needed for creating the `ed_delivery_staging_rpc` role and transferring SECURITY DEFINER ownership. **Do not assume** Supabase Auth semantics can be reproduced merely by setting a session variable.
3. Use only synthetic administrator UUIDs A and B, synthetic entities and synthetic operation UUIDs. Create an allowlisted enabled A and an unlisted/disabled B; create a separate caller with the `authenticated` role. No real accounts.
4. Execute each scenario from a fresh snapshot. Keep two independent connections (S1/S2) where indicated. Record SQLSTATE, returned JSON, committed entity revisions, link rows, operation rows and owner/privilege/RLS metadata. On failure, restore the snapshot; never infer rollback from an error alone.
5. Establish a safe way to pause S1 **after** obtaining its transaction advisory lock and **before** commit, without editing the production schema. If this instrumentation is unavailable, mark concurrency cases BLOCKED instead of treating sequential calls as equivalent.
6. Baseline schema is designed for a Supabase-compatible database. A generic PostgreSQL instance may require isolated, synthetic substitutes for `auth` objects and API roles; record any divergence and do not label such results as production-equivalent.

## Test matrix (all PENDING / NOT EXECUTED)

| ID | Setup and exact action | Expected observation / pass criterion | Blocker |
|---|---|---|---|
| U01 — identical UUID concurrent retry | A submits a valid `ed_delivery_staging_write` with operation UUID U and expected revision 0 in S1; hold S1 before commit. S2 submits the **same** UUID, kind, id, payload, revision and links. Release S1. | Both successful responses equal; exactly one operation row for U and one entity revision increment. S2 waits or serializes safely. | Two sessions and lock orchestration |
| U02 — same UUID, conflicting payload | Repeat U01 but change one field of S2 payload while keeping UUID U. | S1 commits once; S2 returns `23505` idempotency conflict; no second mutation. | Two sessions |
| U03 — same UUID, different actor | A commits U. B is independently enabled and attempts the same U, with identical input. | B must **not** receive A's stored response. Expected rejection `23505` when operation lookup is visible; if RLS hides it, operation UUID uniqueness must still prevent mutation and disclose no private response. Record actual SQLSTATE. | Real RLS semantics |
| U04 — retry after revision changed | A commits U at revision 0; A repeats exactly U with expected revision 0 after the row is revision 1. | Original response returned unchanged, revision stays 1. | Database execution |
| B01 — later item fails | Two canonically sorted batch items: valid supplier create, then warehouse create with missing supplier target; use fresh UUIDs. | Whole batch fails; supplier, warehouse, links and both operation rows absent after rollback. | Transactional DB |
| B02 — dependency success | Canonically sorted batch with active supplier and new warehouse referring to it, each with unique UUID; batch planner must execute supplier first. | Both rows and correct supplier link committed; response array order matches canonical **input**, not phase execution; exactly two operation rows. | Transactional DB |
| B03 — duplicate UUID spellings | Two different entities in one sorted batch, using the same UUID in upper/lowercase textual form. | Reject with `23505` before any mutation; no operation row created. | UUID cast/DB |
| B04 — batch retry | Re-run exactly B02 with same UUIDs, input and expected revisions. | Same response array; no additional revision or link mutation. | Database execution |
| L01 — warehouse deactivation dependency | Create supplier, active warehouse and product_origin linked to it. Attempt `ed_delivery_staging_deactivate('warehouse',...)`. | `23503`; warehouse remains active and unchanged; no operation row for rejected UUID. | FK and transaction |
| L02 — supplier deactivation dependency | Create active supplier and active linked warehouse. Attempt supplier deactivation. | `23503`; supplier unchanged and no operation row for rejected UUID. | FK and transaction |
| L03 — mixed product warehouse set | Create two active warehouses with different supplier/type; submit product_origin referencing both with matching payload and links. | `23514`; no product entity, links or operation row. | Transactional DB |
| L04 — malformed links vs payload | Submit product_origin with warehouseIds [W1,W2] but links [W1,W3], all targets otherwise present. | `23514`; no mutation. | Database execution |
| S01 — unlisted caller | Authenticated synthetic B not in enabled admin_members calls each of read/write/deactivate/batch with valid-shaped arguments. | Every call rejects `42501`; no data or operation mutations. | Accurate auth.uid() test double |
| S02 — disabled administrator | Admin B exists with enabled=false; repeat S01. | Same `42501` rejection. | RLS and identity |
| S03 — SECURITY DEFINER owner | Query `pg_proc`, `pg_roles`, `pg_policies`, `pg_class`, `information_schema.role_table_grants` after isolated setup. | All four RPCs owned by `ed_delivery_staging_rpc`, SECURITY DEFINER true, search_path empty; owner NOLOGIN, NOINHERIT, NOBYPASSRLS and no elevated role flags; RLS enabled on all four tables; API roles have no direct private table privileges. | Role-creation/ownership privileges |
| S04 — RLS actually enforced | In isolated DB, `SET ROLE ed_delivery_staging_rpc` under separate synthetic A/B identity contexts and directly query operations/entities (where privileges allow). | A sees own operation row, B cannot see A's operation row; disabled B sees no private entities. Verify with `row_security_active()` and actual queries; policy metadata alone is insufficient. | Reliable auth identity + SET ROLE |
| S05 — cross-actor UUID disclosure | After A's operation U, enabled B invokes batch with same U and matching payload; also invoke single write. | No successful response containing A's operation result; no mutation by B. Record whether `23505` comes from operation lookup or unique constraint. | RLS behavior |

## Execution protocol (future authorization required)

- Keep a separate evidence record per ID: PostgreSQL version, exact synthetic fixtures, S1/S2 order, SQLSTATE, returned JSON, before/after snapshots, `row_security_active()`, and PASS/FAIL/BLOCKED.
- For U01/U02 use explicit S1/S2 barriers. If S2 is simply run after S1 without overlapping transactions, it **does not** test concurrency.
- For B01/B03/L01–L04 assert absence of **all** partial writes after the failed call. A caught exception inside a larger transaction is not sufficient evidence without a final committed-state query.
- For S01–S05 test under actual SQL roles; do not rely only on text inspection, mock authorization booleans, or direct superuser access.
- Distinguish ordinary write deactivation from the dedicated deactivation RPC; both paths must preserve dependencies.
- Do not run the unresolved same-batch warehouse supplier/type reassignment as a supposed supported success case; that limitation has already been documented separately.
- Keep results PENDING until independently collected. No deployment or migration authorization is implied by this plan.

## Current blockers

- No authorized disposable PostgreSQL runtime; **all 17 cases remain PENDING**.
- Synthetic auth/role scaffolding must be validated before interpreting RLS results.
- Controlled two-session synchronization is needed for UUID races.
- The schema may require migration-owner SET ROLE rights; this plan does not grant them.
- No Supabase, staging, production, real orders or real customer data are authorized.
