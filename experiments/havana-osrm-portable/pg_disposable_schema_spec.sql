-- SPECIFICATION ONLY. DO NOT EXECUTE. Synthetic disposable PostgreSQL design.
-- No production access, real customers, routes, orders or commercial approval.
-- REVIEW GATE: trusted tenant identity must be bound by an external authenticated
-- session mechanism; current_setting alone is NOT authentication.
BEGIN;
CREATE SCHEMA ed_pg_synthetic;
REVOKE ALL ON SCHEMA ed_pg_synthetic FROM PUBLIC;
-- Provision roles externally under independent authorization, never superuser:
-- ed_synth_owner: NOLOGIN NOBYPASSRLS; ed_synth_app: LOGIN NOBYPASSRLS
GRANT USAGE ON SCHEMA ed_pg_synthetic TO ed_synth_app;
CREATE TABLE ed_pg_synthetic.versions (
 tenant_id uuid NOT NULL, basket_id uuid NOT NULL,
 basket_v bigint NOT NULL DEFAULT 0 CHECK (basket_v BETWEEN 0 AND 9223372036854775806),
 address_v bigint NOT NULL DEFAULT 0 CHECK (address_v BETWEEN 0 AND 9223372036854775806),
 routes_v bigint NOT NULL DEFAULT 0 CHECK (routes_v BETWEEN 0 AND 9223372036854775806),
 warehouses_v bigint NOT NULL DEFAULT 0 CHECK (warehouses_v BETWEEN 0 AND 9223372036854775806),
 PRIMARY KEY (tenant_id,basket_id)
);
CREATE TABLE ed_pg_synthetic.quotes (
 tenant_id uuid NOT NULL, quote_id uuid NOT NULL, basket_id uuid NOT NULL,
 basket_v bigint NOT NULL, address_v bigint NOT NULL,
 routes_v bigint NOT NULL, warehouses_v bigint NOT NULL,
 payload_hash text NOT NULL CHECK (length(payload_hash)=64),
 fee_cup numeric(16,2) CHECK (fee_cup >= 0),
 commercial_quote_enabled boolean NOT NULL DEFAULT false CHECK (commercial_quote_enabled=false),
 commercial_approval boolean NOT NULL DEFAULT false CHECK (commercial_approval=false),
 PRIMARY KEY(tenant_id,quote_id),
 FOREIGN KEY (tenant_id,basket_id) REFERENCES ed_pg_synthetic.versions(tenant_id,basket_id)
);
CREATE TABLE ed_pg_synthetic.idempotency (
 tenant_id uuid NOT NULL, operation_id uuid NOT NULL,
 payload_hash text NOT NULL CHECK (length(payload_hash)=64),
 quote_id uuid NOT NULL, outcome text NOT NULL CHECK (outcome IN ('committed','rejected')),
 PRIMARY KEY (tenant_id,operation_id),
 FOREIGN KEY (tenant_id,quote_id) REFERENCES ed_pg_synthetic.quotes(tenant_id,quote_id)
);
ALTER TABLE ed_pg_synthetic.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_pg_synthetic.versions FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_pg_synthetic.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_pg_synthetic.quotes FORCE ROW LEVEL SECURITY;
ALTER TABLE ed_pg_synthetic.idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_pg_synthetic.idempotency FORCE ROW LEVEL SECURITY;
-- Placeholder identity accessor: MUST be replaced by trusted authenticated
-- server-bound tenant identity; arbitrary SET ed.tenant_id is not secure.
CREATE POLICY versions_tenant ON ed_pg_synthetic.versions
 USING (tenant_id = NULLIF(current_setting('ed.tenant_id',true),'')::uuid)
 WITH CHECK (tenant_id = NULLIF(current_setting('ed.tenant_id',true),'')::uuid);
CREATE POLICY quotes_tenant ON ed_pg_synthetic.quotes
 USING (tenant_id = NULLIF(current_setting('ed.tenant_id',true),'')::uuid)
 WITH CHECK (tenant_id = NULLIF(current_setting('ed.tenant_id',true),'')::uuid);
CREATE POLICY idempotency_tenant ON ed_pg_synthetic.idempotency
 USING (tenant_id = NULLIF(current_setting('ed.tenant_id',true),'')::uuid)
 WITH CHECK (tenant_id = NULLIF(current_setting('ed.tenant_id',true),'')::uuid);
REVOKE ALL ON ALL TABLES IN SCHEMA ed_pg_synthetic FROM PUBLIC;
-- No direct table grants to application: operations require separately
-- reviewed RPCs with trusted identity, fixed search_path, non-bypass owner.
-- CAS pattern, illustrative ONLY, not an executable RPC:
-- UPDATE ed_pg_synthetic.versions SET routes_v=routes_v+1
-- WHERE tenant_id=:trusted_tenant AND basket_id=:basket
--   AND basket_v=:basket_v AND address_v=:address_v
--   AND routes_v=:routes_v AND warehouses_v=:warehouses_v
-- RETURNING routes_v;
-- Check exactly one RETURNING row, otherwise ROLLBACK.
-- Quote persistence MUST lock versions row FOR UPDATE in same transaction,
-- recheck all four versions and atomically persist quote + idempotency.
-- INSERT idempotency ... ON CONFLICT ... requires same hash verification,
-- and unique operation key; no blind DO UPDATE or duplicate fee.
-- No executable SECURITY DEFINER functions in this draft.
ROLLBACK;
