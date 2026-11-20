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


## Reproducibility corrections (documentation only)

The matrix above defines intent but does **not** yet supply an executable harness. The following details remove concrete ambiguities; all commands are **examples for a future authorized disposable database**, not executed SQL.

### Stable fixtures and call signatures

- Use fixed synthetic UUIDs: A=`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, B=`bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`; operation U=`11111111-1111-4111-8111-111111111111`. For multi-item tests use `22222222-2222-4222-8222-222222222222` as the second operation UUID. Each test must start from a **clean snapshot**; UUIDs may be reused **between isolated tests**, never within one committed fixture except for intentional retries.
- Synthetic entities: `supplier` S1/S2 payload `{"active":true}`; `warehouse` W1 payload `{"type":"proveedor","supplierId":"S1","active":true,"defaultForSupplier":false}` with `[{"target_kind":"supplier","target_id":"S1"}]`; W2 references S2 analogously. A `product_origin` P1 with `{"warehouseIds":["W1"]}` and `[{"target_kind":"warehouse","target_id":"W1"}]`. For L03 use W1/S1 and W2/S2, P1 `warehouseIds=["W1","W2"]` with both links. For L04 use W1/W2/W3, all created beforehand, and a mismatched W3 link.
- All `ed_delivery_staging_write` calls use positional arguments `(operation_uuid::uuid, kind::text, id::text, payload::jsonb, expected_revision::bigint, links::jsonb)`. Create: revision 0; update: revision read from fixture. `ed_delivery_staging_deactivate` uses `(kind,id,expected_revision,operation_uuid)`. Batch uses one JSONB array of items with keys `operation_id`, `kind`, `id`, `payload`, `expected_revision`, `links`.
- For **B01/B02/B04**, the canonical `kind:id` order is `supplier:S1` then `warehouse:W1`; this **does not exercise a reversed dependency order**. B02 proves only successful supplier-to-warehouse dependency, not reordering. A separate test would need canonically earlier kind whose execution phase is later, e.g. `product_origin:P1` and `warehouse:W1` in sorted input; warehouse must be created before product in execution and responses must still follow input order. Record this limitation instead of claiming B02 verifies reordering.
- For U01/U02, S1 must use an explicit transaction, invoke the RPC, then **leave its transaction open** before COMMIT while S2 invokes the RPC asynchronously in another connection. Verify S2 is blocked **before** releasing S1; then COMMIT S1 and collect both results. Do not pause inside the RPC or rely on sleep timings. Use a bounded statement timeout and capture lock/wait evidence.
- For U03/S05, enable B explicitly for the cross-actor tests. For S01 B must be absent from `admin_members`; for S02 B must exist with `enabled=false`. Restore the snapshot between these tests. A and B must have separate verified `auth.uid()` values in the test harness, not merely different SQL session labels.
- For S04, `SET ROLE ed_delivery_staging_rpc` is valid only if the test executor is authorized to SET ROLE. Confirm `SELECT current_user, session_user, auth.uid(), row_security_active('ed_delivery_private.operations'::regclass)` under the intended context; the same `auth.uid()` value in both sessions invalidates the isolation test. Ensure that the synthetic identity mechanism cannot be controlled by an untrusted API caller.

### Committed-state and evidence criteria

For each scenario, capture before and after **committed** snapshots of `ed_delivery_private.entities` (kind,id,revision,payload), `links` (all four key columns), and `operations` (operation_id,actor_id,payload,response). For a failed RPC inside an explicit transaction, issue ROLLBACK or roll back to a savepoint and then query committed state using a separate authorized observer connection. An exception alone does not prove rollback.

- **U01/U02:** exactly one operation U, and no additional entity revision. A conflict must not reveal another actor's stored response.
- **B01/B03:** all fixture rows must match the pre-batch committed snapshot; verify no partial operation UUIDs.
- **B02/B04:** compare the returned JSON array with the input's **ordinality**, plus exact stored response JSON by UUID.
- **L01–L04:** verify both entity and link rows, not only the reported SQLSTATE.
- **S01–S05:** capture SQL role identity, authenticated identity, RLS-active status, and grants. If role setup or identity simulation differs from the schema's assumptions, mark BLOCKED rather than PASS.

A result is PASS only when the specified outcome, SQLSTATE where specified, and committed-state assertions all agree. Record FAIL for a demonstrated mismatch, and BLOCKED when infrastructure, identity or synchronization prerequisites are absent. All tests remain **PENDING / NOT EXECUTED**.
