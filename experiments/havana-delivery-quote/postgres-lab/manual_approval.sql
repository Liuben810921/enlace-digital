-- Offline-only PostgreSQL design. NOT deployed. Run in disposable database only.
BEGIN;
CREATE SCHEMA IF NOT EXISTS ed_delivery_lab;
CREATE TABLE ed_delivery_lab.configuration (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revision bigint NOT NULL CHECK (revision>=0),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object')
);
CREATE TABLE ed_delivery_lab.approvals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text NOT NULL CHECK (length(actor_id)>0),
  operation_id text NOT NULL CHECK (length(operation_id)>0),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  configuration_revision bigint NOT NULL CHECK (configuration_revision>=0),
  fee_cup bigint NOT NULL CHECK (fee_cup>=0),
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  UNIQUE(actor_id,operation_id),
  CHECK(expires_at>created_at),
  CHECK(revoked_at IS NULL OR revoked_at>=created_at)
);
CREATE INDEX ON ed_delivery_lab.approvals (request_fingerprint,configuration_revision) WHERE revoked_at IS NULL;
REVOKE ALL ON SCHEMA ed_delivery_lab FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA ed_delivery_lab FROM PUBLIC;
COMMIT;
-- Required future transaction contract (not implemented as SECURITY DEFINER RPC):
-- 1. Verify actor identity/role via server-trusted auth, never caller-supplied role.
-- 2. BEGIN; lock configuration singleton FOR UPDATE; recompute canonical request fingerprint
--    from trusted cart, destination, origins, and delivery rules, not client JSON.
-- 3. INSERT approval with actor_id+operation_id UNIQUE. ON CONFLICT: lock existing row,
--    compare fingerprint/revision/fee; if changed return CONFLICT, if revoked/expired
--    return PENDIENTE; otherwise return existing ID. No unconditional DO UPDATE.
-- 4. Revocation: UPDATE approvals SET revoked_at=transaction_timestamp()
--    WHERE id=:id AND revoked_at IS NULL; repeat revocation is idempotent.
-- 5. Resolve: lock/read approval; validate current revision and recomputed fingerprint,
--    approver current permissions, revocation and expiry using database clock.
-- 6. Never turn offline simulation into payable quote. Courier charge remains outside checkout.
