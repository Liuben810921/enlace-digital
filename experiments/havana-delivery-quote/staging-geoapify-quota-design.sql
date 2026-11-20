-- OFFLINE DESIGN ONLY: do not execute on staging without approval.
-- Private schema; transaction-scoped advisory lock serializes all reservations.
-- One outbound provider request per unique request_id; UNKNOWN attempts consume quota.
create schema if not exists ed_internal;
create table if not exists ed_internal.geoapify_daily_quota (
 day_utc date primary key,
 reserved_count integer not null default 0 check (reserved_count >= 0),
 daily_limit integer not null check (daily_limit between 1 and 100)
);
create table if not exists ed_internal.geoapify_requests (
 request_id text primary key check (request_id ~ '^[A-Za-z0-9_-]{12,64}$'),
 day_utc date not null references ed_internal.geoapify_daily_quota(day_utc),
 operator_id uuid not null,
 payload_hash text not null check (length(payload_hash)=64),
 context_revision bigint not null check (context_revision >= 0),
 status text not null default 'RESERVED' check (status in ('RESERVED','UNKNOWN','COMPLETED','FAILED')),
 created_at timestamptz not null default now()
);
revoke all on schema ed_internal from public, anon, authenticated;
revoke all on all tables in schema ed_internal from public, anon, authenticated;
alter table ed_internal.geoapify_daily_quota enable row level security;
alter table ed_internal.geoapify_requests enable row level security;
-- Invoke ONLY through a narrowly granted technical role and trusted server adapter.
-- Avoid owner postgres/BYPASSRLS. RLS policies must be created for that role separately.
-- Pseudocode transaction (single DB transaction, never separate read/write):
-- BEGIN;
-- SELECT pg_advisory_xact_lock(70401, date_epoch_day);
-- INSERT daily row with approved limit, ON CONFLICT DO NOTHING;
-- SELECT existing request FOR UPDATE;
-- if existing: reject payload mismatch; return existing status, NEVER reissue network call;
-- if new: UPDATE quota SET reserved_count=reserved_count+1
--   WHERE day_utc=today AND reserved_count<daily_limit RETURNING reserved_count;
-- if no row: reject QUOTA_EXHAUSTED;
-- INSERT request_id/operator_id/payload_hash/context_revision/status=RESERVED;
-- COMMIT; then provider call at most once; timeout/crash => UNKNOWN, no automatic retry.
-- No quota reset on failed/unknown requests; human approval required for retries.
