-- OFFLINE PROTOTYPE ONLY. DO NOT EXECUTE ON STAGING WITHOUT APPROVAL.
-- Precondition: dedicated LOGIN role ed_geoapify_worker, NO BYPASSRLS, NO CREATEDB.
-- Operator identity must be established by trusted Supabase Auth user verification,
-- then membership in a server-maintained admin ACL, never client metadata.
create schema if not exists ed_internal;
create table if not exists ed_internal.geoapify_operator_acl (
 user_id uuid primary key,
 role text not null check (role in ('principal','administrador_general')),
 active boolean not null default true
);
create table if not exists ed_internal.geoapify_daily_quota (
 day_utc date primary key,
 reserved_count integer not null default 0 check (reserved_count >= 0),
 daily_limit integer not null check (daily_limit between 1 and 100)
);
create table if not exists ed_internal.geoapify_requests (
 request_id text primary key check (request_id ~ '^[A-Za-z0-9_-]{12,64}$'),
 day_utc date not null references ed_internal.geoapify_daily_quota(day_utc),
 operator_id uuid not null,
 payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
 context_revision bigint not null check (context_revision >= 0),
 status text not null default 'RESERVED' check (status in ('RESERVED','UNKNOWN','COMPLETED','FAILED')),
 created_at timestamptz not null default now()
);
revoke all on schema ed_internal from public, anon, authenticated;
revoke all on all tables in schema ed_internal from public, anon, authenticated;
alter table ed_internal.geoapify_operator_acl enable row level security;
alter table ed_internal.geoapify_daily_quota enable row level security;
alter table ed_internal.geoapify_requests enable row level security;
-- Run by provisioning owner ONLY after creating the technical role:
-- grant usage on schema ed_internal to ed_geoapify_worker;
-- grant select on ed_internal.geoapify_operator_acl to ed_geoapify_worker;
-- grant select,insert,update on ed_internal.geoapify_daily_quota to ed_geoapify_worker;
-- grant select,insert on ed_internal.geoapify_requests to ed_geoapify_worker;
-- create policy ... for each table TO ed_geoapify_worker USING (true) WITH CHECK (true);
-- These grants/policies must be reviewed and installed atomically in staging.
-- SECURITY INVOKER: worker must have explicit table permissions and RLS policies.
create or replace function ed_internal.reserve_geoapify_request(
 p_operator uuid, p_request_id text, p_payload_hash text,
 p_context_revision bigint, p_daily_limit integer
) returns table(outcome text, reserved_request_id text)
language plpgsql security invoker set search_path = pg_catalog, ed_internal
as $$
declare
 v_today date := (transaction_timestamp() at time zone 'UTC')::date;
 v_existing ed_internal.geoapify_requests%rowtype;
 v_updated integer;
begin
 if p_operator is null or p_request_id !~ '^[A-Za-z0-9_-]{12,64}$'
    or p_payload_hash !~ '^[0-9a-f]{64}$'
    or p_context_revision is null or p_context_revision < 0
    or p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 100 then
   return query select 'INVALID_REQUEST'::text, null::text; return;
 end if;
 if not exists(select 1 from ed_internal.geoapify_operator_acl
   where user_id=p_operator and active and role in ('principal','administrador_general')) then
   return query select 'UNAUTHORIZED'::text, null::text; return;
 end if;
 -- Serialize all reservations for this UTC day, including first-row creation.
 perform pg_advisory_xact_lock(70401, v_today - date '2000-01-01');
 select * into v_existing from ed_internal.geoapify_requests where request_id=p_request_id;
 if found then
   if v_existing.operator_id<>p_operator or v_existing.payload_hash<>p_payload_hash
      or v_existing.context_revision<>p_context_revision then
     return query select 'IDEMPOTENCY_CONFLICT'::text, null::text;
   else
     -- Never issue another outbound call on replay, even after failure/timeout.
     return query select 'ALREADY_RESERVED'::text, p_request_id;
   end if;
   return;
 end if;
 insert into ed_internal.geoapify_daily_quota(day_utc,reserved_count,daily_limit)
 values(v_today,0,p_daily_limit) on conflict(day_utc) do nothing;
 -- Effective cap cannot be raised by a caller after first creation.
 update ed_internal.geoapify_daily_quota
 set reserved_count=reserved_count+1
 where day_utc=v_today and reserved_count<daily_limit
 returning reserved_count into v_updated;
 if v_updated is null then
   return query select 'QUOTA_EXHAUSTED'::text, null::text; return;
 end if;
 insert into ed_internal.geoapify_requests(request_id,day_utc,operator_id,payload_hash,context_revision)
 values(p_request_id,v_today,p_operator,p_payload_hash,p_context_revision);
 return query select 'RESERVED'::text, p_request_id;
end $$;
revoke all on function ed_internal.reserve_geoapify_request(uuid,text,text,bigint,integer) from public, anon, authenticated;
-- grant execute on function ed_internal.reserve_geoapify_request(uuid,text,text,bigint,integer) to ed_geoapify_worker;
-- IMPORTANT: Caller must NOT choose operator_id or quota limit. The trusted server
-- derives operator_id from a verified access token and uses a server-owned fixed cap.
-- No network request is permitted unless outcome = RESERVED from a COMMITTED tx.
-- Crash after commit => reservation consumed, request UNKNOWN; no automatic retry.
