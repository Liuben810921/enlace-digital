-- PREPARADO: NO EJECUTAR SIN AUTORIZACIÓN ESPECÍFICA. SOLO STAGING xqahthghvozeigbojhyi
-- Requiere identidad Supabase Auth real; las sesiones locales de clientes NO autorizan administración.
begin;
create schema if not exists ed_delivery_private;
revoke all on schema ed_delivery_private from public, anon, authenticated;
create table ed_delivery_private.admin_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false
);
create table ed_delivery_private.entities (
 kind text not null check(kind in ('supplier','warehouse','product_origin','destination','shipment_draft')),
 id text not null check(length(id) between 1 and 160),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 revision bigint not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 primary key(kind,id)
);
create table ed_delivery_private.links (
 source_kind text not null check(source_kind in ('warehouse','product_origin','shipment_draft')),
 source_id text not null,
 target_kind text not null check(target_kind in ('supplier','warehouse','destination','product_origin')),
 target_id text not null,
 primary key(source_kind,source_id,target_kind,target_id),
 foreign key(source_kind,source_id) references ed_delivery_private.entities(kind,id) on delete cascade,
 foreign key(target_kind,target_id) references ed_delivery_private.entities(kind,id) on delete restrict,
 check (
 (source_kind='warehouse' and target_kind='supplier') or
 (source_kind='product_origin' and target_kind='warehouse') or
 (source_kind='shipment_draft' and target_kind in ('destination','product_origin'))
 )
);
create table ed_delivery_private.operations (
 operation_id uuid primary key,
 actor_id uuid not null,
 payload jsonb not null,
 response jsonb not null,
 created_at timestamptz not null default now()
);
alter table ed_delivery_private.admin_members enable row level security;
alter table ed_delivery_private.entities enable row level security;
alter table ed_delivery_private.links enable row level security;
alter table ed_delivery_private.operations enable row level security;
revoke all on all tables in schema ed_delivery_private from public, anon, authenticated;
-- SECURITY DEFINER functions are transferred below to a dedicated NOBYPASSRLS role.
-- RLS applies to that role; the authenticated caller must also be allowlisted.
create or replace function public.ed_delivery_staging_read()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_result jsonb;
begin
 if v_user is null or not exists(select 1 from ed_delivery_private.admin_members where user_id=v_user and enabled) then
  raise exception 'not authorized' using errcode='42501';
 end if;
 select jsonb_build_object('entities',coalesce((select jsonb_agg(jsonb_build_object('kind',kind,'id',id,'payload',payload,'revision',revision)) from ed_delivery_private.entities),'[]'::jsonb),
 'links',coalesce((select jsonb_agg(jsonb_build_object('source_kind',source_kind,'source_id',source_id,'target_kind',target_kind,'target_id',target_id)) from ed_delivery_private.links),'[]'::jsonb)) into v_result;
 return v_result;
end $$;
create or replace function public.ed_delivery_staging_write(p_operation_id uuid,p_kind text,p_id text,p_payload jsonb,p_expected_revision bigint,p_links jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user uuid:=auth.uid(); v_old bigint; v_revision bigint; v_existing record; v_result jsonb; v_link jsonb; v_target_kind text; v_target_id text;
begin
 if v_user is null or not exists(select 1 from ed_delivery_private.admin_members where user_id=v_user and enabled) then
  raise exception 'not authorized' using errcode='42501';
 end if;
 if p_expected_revision is null or p_expected_revision < 0 or p_operation_id is null or p_kind is null or p_kind not in ('supplier','warehouse','product_origin','destination','shipment_draft') or p_id is null or length(p_id) not between 1 and 160 or jsonb_typeof(p_payload) is distinct from 'object' or jsonb_typeof(p_links) is distinct from 'array' then
  raise exception 'invalid request' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(672045900001::bigint); -- global staging write lock: serialize all mutation paths
 perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 select * into v_existing from ed_delivery_private.operations where operation_id=p_operation_id;
 if found then
  if v_existing.actor_id<>v_user or v_existing.payload<>jsonb_build_object('kind',p_kind,'id',p_id,'payload',p_payload,'expected_revision',p_expected_revision,'links',p_links) then
   raise exception 'idempotency conflict' using errcode='23505';
  end if;
  return v_existing.response;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_kind||':'||p_id,1));
 select revision into v_old from ed_delivery_private.entities where kind=p_kind and id=p_id for update;
 if p_expected_revision is distinct from coalesce(v_old,0) then
  raise exception 'revision conflict' using errcode='40001';
 end if;
 -- Refuse inconsistent payload/link pairs; do not trust browser validation.
 -- A malformed default flag must not bypass the single-default invariant.
 -- The bridge sends JSON booleans, not strings or arbitrary values.
 if p_kind='warehouse' and (
   jsonb_typeof(p_payload->'defaultForSupplier') is distinct from 'boolean'
   or jsonb_typeof(p_payload->'active') is distinct from 'boolean'
 ) then raise exception 'warehouse flags must be booleans' using errcode='23514'; end if;
 if p_kind='warehouse' and (
   (p_payload->>'type'='proveedor' and
     (nullif(p_payload->>'supplierId','') is null or jsonb_array_length(p_links)<>1 or
      not exists(select 1 from jsonb_array_elements(p_links) x where x->>'target_kind'='supplier' and x->>'target_id'=p_payload->>'supplierId')))
   or (p_payload->>'type'='propio' and (jsonb_array_length(p_links)<>0 or nullif(p_payload->>'supplierId','') is not null))
   or p_payload->>'type' is null or p_payload->>'type' not in ('propio','proveedor')
 ) then raise exception 'warehouse links inconsistent' using errcode='23514'; end if;
 -- Enforce a nonempty, duplicate-free warehouse set. JSON arrays must not
 -- encode the same relationship more than once.
 if p_kind='product_origin' and jsonb_typeof(p_payload->'warehouseIds')='array'
  and (jsonb_array_length(p_payload->'warehouseIds')=0
    or (select count(distinct value) from jsonb_array_elements_text(p_payload->'warehouseIds'))
       <>jsonb_array_length(p_payload->'warehouseIds'))
 then raise exception 'duplicate or empty warehouse associations' using errcode='23514'; end if;
 if p_kind='product_origin' and jsonb_typeof(p_payload->'warehouseIds') is distinct from 'array' then
  raise exception 'association warehouses must be an array' using errcode='23514';
 end if;
 if p_kind='product_origin' and (
   jsonb_array_length(p_payload->'warehouseIds')<>jsonb_array_length(p_links) or
   exists(select 1 from jsonb_array_elements(p_links) l where l->>'target_kind' is distinct from 'warehouse') or
   exists(select 1 from jsonb_array_elements_text(p_payload->'warehouseIds') w
     where not exists(select 1 from jsonb_array_elements(p_links) l
       where l->>'target_kind'='warehouse' and l->>'target_id'=w.value))
 ) then raise exception 'association links inconsistent' using errcode='23514'; end if;
 if p_kind='shipment_draft' and jsonb_typeof(p_payload->'productIds')='array'
  and (select count(distinct value) from jsonb_array_elements_text(p_payload->'productIds'))
       <>jsonb_array_length(p_payload->'productIds')
 then raise exception 'duplicate draft products' using errcode='23514'; end if;
 if p_kind='shipment_draft' then
  if jsonb_typeof(p_payload->'productIds') is distinct from 'array' then
   raise exception 'draft products must be an array' using errcode='23514';
  end if;
  if nullif(p_payload->>'destinationId','') is null
    or jsonb_array_length(p_payload->'productIds')=0
    or jsonb_array_length(p_links)<>jsonb_array_length(p_payload->'productIds')+1
    or (select count(*) from jsonb_array_elements(p_links) l
      where l->>'target_kind'='destination' and l->>'target_id'=p_payload->>'destinationId')<>1
    or exists(select 1 from jsonb_array_elements(p_links) l
      where l->>'target_kind' not in ('destination','product_origin') or l->>'target_kind' is null)
    or exists(select 1 from jsonb_array_elements_text(p_payload->'productIds') p
      where not exists(select 1 from jsonb_array_elements(p_links) l
        where l->>'target_kind'='product_origin' and l->>'target_id'=p.value))
  then raise exception 'draft links inconsistent' using errcode='23514'; end if;
 end if;
 -- Reject duplicate links and malformed link objects before mutating entities.
 -- Otherwise duplicate pairs can fail only after the entity has been written.
 if exists(select 1 from jsonb_array_elements(p_links) l
    where jsonb_typeof(l.value) is distinct from 'object'
      or nullif(l.value->>'target_kind','') is null
      or nullif(l.value->>'target_id','') is null)
    or (select count(*) from (
      select l.value->>'target_kind' as kind,l.value->>'target_id' as id
      from jsonb_array_elements(p_links) l
      group by 1,2 having count(*)>1
    ) duplicates)>0
 then raise exception 'duplicate or malformed links' using errcode='23514'; end if;
 -- Serialize all default-warehouse changes for a supplier. This check applies
 -- to single writes and every item of a batch, not just the browser.
 -- An inactive warehouse cannot be marked as default, and a supplier
 -- warehouse must have exactly one supplier link.
 if p_kind='warehouse' and p_payload->>'type'='proveedor' and p_payload->>'active'='true'
    and not exists(select 1 from ed_delivery_private.entities e
      where e.kind='supplier' and e.id=p_payload->>'supplierId'
        and e.payload->>'active' is distinct from 'false')
 then raise exception 'supplier is inactive or missing' using errcode='23514'; end if;
 if p_kind='warehouse' and p_payload->>'defaultForSupplier'='true' then
  if p_payload->>'type' is distinct from 'proveedor' or nullif(p_payload->>'supplierId','') is null
   or p_payload->>'active' is distinct from 'true' then
   raise exception 'invalid default warehouse' using errcode='23514';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('default:supplier:'||(p_payload->>'supplierId'),2));
  if exists(
   select 1 from ed_delivery_private.entities e
   where e.kind='warehouse' and e.id<>p_id
    and e.payload->>'type'='proveedor'
    and e.payload->>'supplierId'=p_payload->>'supplierId'
    and e.payload->>'defaultForSupplier'='true'
  ) then raise exception 'supplier already has default warehouse' using errcode='23505'; end if;
 end if;
  -- An inactive or own-stock warehouse cannot retain a supplier default.
 -- A warehouse with product associations cannot silently change supplier/type.
 -- Product reassignment must first remove or replace those associations.
 if p_kind='warehouse' and v_old is not null and exists(
  select 1 from ed_delivery_private.links l
  where l.target_kind='warehouse' and l.target_id=p_id and l.source_kind='product_origin'
 ) and exists(
  select 1 from ed_delivery_private.entities old
  where old.kind='warehouse' and old.id=p_id and
   (old.payload->>'type' is distinct from p_payload->>'type'
    or old.payload->>'supplierId' is distinct from p_payload->>'supplierId')
 ) then raise exception 'reassign product associations before warehouse supplier/type change' using errcode='23503'; end if;
 -- Guard the ordinary write RPC against bypassing the dedicated deactivation
 -- dependency checks by simply setting payload.active=false.
 if p_kind='warehouse' and p_payload->>'active'='false' and exists(
  select 1 from ed_delivery_private.links l where l.target_kind='warehouse'
   and l.target_id=p_id and l.source_kind='product_origin'
 ) then raise exception 'warehouse has product associations' using errcode='23503'; end if;
 if p_kind='supplier' and p_payload->>'active'='false' and exists(
  select 1 from ed_delivery_private.links l
   join ed_delivery_private.entities w on w.kind='warehouse' and w.id=l.source_id
   where l.source_kind='warehouse' and l.target_kind='supplier' and l.target_id=p_id
    and w.payload->>'active' is distinct from 'false'
 ) then raise exception 'supplier has active warehouses' using errcode='23503'; end if;
  v_revision:=coalesce(v_old,0)+1;
 insert into ed_delivery_private.entities(kind,id,payload,revision) values(p_kind,p_id,p_payload,v_revision)
 on conflict(kind,id) do update set payload=excluded.payload,revision=excluded.revision,updated_at=now();
 delete from ed_delivery_private.links where source_kind=p_kind and source_id=p_id;
 for v_link in select value from jsonb_array_elements(p_links) loop
  if v_link->>'target_kind' is null or v_link->>'target_id' is null or not ( (p_kind='warehouse' and v_link->>'target_kind'='supplier') or (p_kind='product_origin' and v_link->>'target_kind'='warehouse') or (p_kind='shipment_draft' and v_link->>'target_kind' in ('destination','product_origin')) ) or not exists (select 1 from ed_delivery_private.entities e where e.kind=v_link->>'target_kind' and e.id=v_link->>'target_id') then raise exception 'invalid or missing link target' using errcode='23503'; end if;
  v_target_kind:=v_link->>'target_kind'; v_target_id:=v_link->>'target_id';
  -- Same transaction-scoped lock as deactivation and entity edits. The
  -- subsequent active-state check is protected against concurrent changes.
  perform pg_advisory_xact_lock(hashtextextended(v_target_kind||':'||v_target_id,1));
  -- Lock the referenced row until commit so concurrent deactivation cannot race
  -- the validation. Entity edits are serialized by the same advisory key.
  perform 1 from ed_delivery_private.entities where kind=v_target_kind and id=v_target_id for share;
  if not found then raise exception 'missing link target' using errcode='23503'; end if;
  if ((p_kind='warehouse' and v_target_kind='supplier') or (p_kind='product_origin' and v_target_kind='warehouse')) and
   not exists(select 1 from ed_delivery_private.entities where kind=v_target_kind and id=v_target_id and payload->>'active' is distinct from 'false') then
    raise exception 'inactive supplier' using errcode='23514';
  end if;
  insert into ed_delivery_private.links(source_kind,source_id,target_kind,target_id)
  values(p_kind,p_id,v_target_kind,v_target_id);
 end loop;
 if p_kind='product_origin' and (
   exists(
    select 1 from ed_delivery_private.links l
    join ed_delivery_private.entities w on w.kind='warehouse' and w.id=l.target_id
    where l.source_kind='product_origin' and l.source_id=p_id and l.target_kind='warehouse'
     and (w.payload->>'active'='false'
       or (w.payload->>'type'='proveedor' and not exists(
        select 1 from ed_delivery_private.entities supplier
        where supplier.kind='supplier' and supplier.id=w.payload->>'supplierId'
         and supplier.payload->>'active' is distinct from 'false')))
   ) or exists(
    select 1 from ed_delivery_private.links a
    join ed_delivery_private.entities wa on wa.kind='warehouse' and wa.id=a.target_id
    join ed_delivery_private.links b on b.source_kind=a.source_kind and b.source_id=a.source_id
      and b.target_kind='warehouse' and b.target_id>a.target_id
    join ed_delivery_private.entities wb on wb.kind='warehouse' and wb.id=b.target_id
    where a.source_kind='product_origin' and a.source_id=p_id and a.target_kind='warehouse'
      and (wa.payload->>'type' is distinct from wb.payload->>'type'
        or wa.payload->>'supplierId' is distinct from wb.payload->>'supplierId')
   )
 ) then raise exception 'incompatible product warehouses' using errcode='23514'; end if;
  v_result:=jsonb_build_object('kind',p_kind,'id',p_id,'revision',v_revision);
 insert into ed_delivery_private.operations(operation_id,actor_id,payload,response)
 values(p_operation_id,v_user,jsonb_build_object('kind',p_kind,'id',p_id,'payload',p_payload,'expected_revision',p_expected_revision,'links',p_links),v_result);
 return v_result;
end $$;
revoke all on function public.ed_delivery_staging_read() from public,anon,authenticated;
revoke all on function public.ed_delivery_staging_write(uuid,text,text,jsonb,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.ed_delivery_staging_read() to authenticated;
grant execute on function public.ed_delivery_staging_write(uuid,text,text,jsonb,bigint,jsonb) to authenticated;
-- IMPORTANT: first admin_members row must be provisioned via a separately authorized
-- owner-only action for an existing staging auth.users UUID; no anonymous bootstrap.
-- This migration alone deliberately grants no administrator access.
-- Non-bypass RPC owner; table ownership remains with migration owner.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='ed_delivery_staging_rpc') then
  create role ed_delivery_staging_rpc nologin noinherit nobypassrls;
 end if;
end $$;
-- PostgreSQL requires the migration executor to be able to SET ROLE to
-- the new owner before ALTER FUNCTION OWNER; schema CREATE alone is insufficient.
-- Fail inside this transaction rather than silently using a privileged owner.
do $$ begin
 if not pg_has_role(current_user,'ed_delivery_staging_rpc','SET') then
  raise exception 'migration executor cannot SET ROLE to RPC owner; authorize a separate least-privilege membership grant before migration' using errcode='42501';
 end if;
end $$;
grant usage on schema ed_delivery_private to ed_delivery_staging_rpc;
grant usage on schema auth to ed_delivery_staging_rpc;
grant execute on function auth.uid() to ed_delivery_staging_rpc;
grant select on ed_delivery_private.admin_members to ed_delivery_staging_rpc;
grant usage,create on schema public to ed_delivery_staging_rpc; -- temporary, revoked before commit
grant select,insert,update on ed_delivery_private.entities to ed_delivery_staging_rpc;
grant select,insert,delete on ed_delivery_private.links to ed_delivery_staging_rpc;
grant select,insert on ed_delivery_private.operations to ed_delivery_staging_rpc;
-- SECURITY DEFINER owner also needs sequence permissions if serial IDs are added later; none exist here.
-- The owner of SECURITY DEFINER RPCs must have only the required grants.
-- Do not grant BYPASSRLS, login, table ownership, or direct privileges to API roles.
do $$ begin
 if exists(select 1 from pg_roles where rolname='ed_delivery_staging_rpc' and
   (rolbypassrls or rolcanlogin or rolsuper or rolcreaterole or rolcreatedb or rolinherit or rolreplication)) then
  raise exception 'unsafe RPC owner role' using errcode='42501';
 end if;
end $$;
create policy ed_admin_self_read on ed_delivery_private.admin_members
 for select to ed_delivery_staging_rpc using (user_id = (select auth.uid()) and enabled);
create policy ed_entities_admin on ed_delivery_private.entities
 for all to ed_delivery_staging_rpc
 using (exists(select 1 from ed_delivery_private.admin_members m where m.user_id=(select auth.uid()) and m.enabled))
 with check (exists(select 1 from ed_delivery_private.admin_members m where m.user_id=(select auth.uid()) and m.enabled));
create policy ed_links_admin on ed_delivery_private.links
 for all to ed_delivery_staging_rpc
 using (exists(select 1 from ed_delivery_private.admin_members m where m.user_id=(select auth.uid()) and m.enabled))
 with check (exists(select 1 from ed_delivery_private.admin_members m where m.user_id=(select auth.uid()) and m.enabled));
create policy ed_operations_admin on ed_delivery_private.operations
 for all to ed_delivery_staging_rpc
 using (actor_id=(select auth.uid()) and exists(select 1 from ed_delivery_private.admin_members m where m.user_id=(select auth.uid()) and m.enabled))
 with check (actor_id=(select auth.uid()) and exists(select 1 from ed_delivery_private.admin_members m where m.user_id=(select auth.uid()) and m.enabled));
alter function public.ed_delivery_staging_read() owner to ed_delivery_staging_rpc;
alter function public.ed_delivery_staging_write(uuid,text,text,jsonb,bigint,jsonb) owner to ed_delivery_staging_rpc;
-- Explicit soft deactivation avoids breaking linked warehouses and historical drafts.
create or replace function public.ed_delivery_staging_deactivate(p_kind text,p_id text,p_expected_revision bigint,p_operation_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid:=auth.uid(); v_entity ed_delivery_private.entities%rowtype; v_previous ed_delivery_private.operations%rowtype; v_args jsonb; v_result jsonb;
begin
 if v_actor is null or not exists(select 1 from ed_delivery_private.admin_members where user_id=v_actor and enabled) then
  raise exception 'not authorized' using errcode='42501';
 end if;
 if p_kind is null or p_kind not in ('supplier','warehouse','destination') or p_id is null or p_expected_revision is null or p_expected_revision<1 or p_operation_id is null then
  raise exception 'invalid deactivation' using errcode='22023';
 end if;
 v_args:=jsonb_build_object('action','deactivate','kind',p_kind,'id',p_id,'expected_revision',p_expected_revision);
 perform pg_advisory_xact_lock(672045900001::bigint); -- global staging write lock: serialize all mutation paths
 perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 select * into v_previous from ed_delivery_private.operations where operation_id=p_operation_id;
 if found then
  if v_previous.actor_id<>v_actor or v_previous.payload<>v_args then raise exception 'idempotency conflict' using errcode='23505'; end if;
  return v_previous.response;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_kind||':'||p_id,1));
 select * into v_entity from ed_delivery_private.entities where kind=p_kind and id=p_id for update;
 if not found or v_entity.revision<>p_expected_revision then raise exception 'revision conflict' using errcode='40001'; end if;
 if p_kind='supplier' and exists(
   select 1 from ed_delivery_private.links l
   join ed_delivery_private.entities w on w.kind='warehouse' and w.id=l.source_id
   where l.source_kind='warehouse' and l.target_kind='supplier' and l.target_id=p_id
    and w.payload->>'active' is distinct from 'false'
 ) then raise exception 'supplier has active warehouses' using errcode='23503'; end if;
 if p_kind='warehouse' and exists(
   select 1 from ed_delivery_private.links l
   where l.target_kind='warehouse' and l.target_id=p_id and l.source_kind='product_origin'
 ) then raise exception 'warehouse has product associations' using errcode='23503'; end if;
 update ed_delivery_private.entities set payload=case when p_kind='warehouse' then jsonb_set(jsonb_set(payload,'{active}','false'::jsonb,true),'{defaultForSupplier}','false'::jsonb,true) else jsonb_set(payload,'{active}','false'::jsonb,true) end,revision=revision+1,updated_at=now()
 where kind=p_kind and id=p_id;
 v_result:=jsonb_build_object('kind',p_kind,'id',p_id,'revision',p_expected_revision+1,'active',false);
 insert into ed_delivery_private.operations(operation_id,actor_id,payload,response) values(p_operation_id,v_actor,v_args,v_result);
 return v_result;
end $$;
revoke all on function public.ed_delivery_staging_deactivate(text,text,bigint,uuid) from public,anon,authenticated;
grant execute on function public.ed_delivery_staging_deactivate(text,text,bigint,uuid) to authenticated;
alter function public.ed_delivery_staging_deactivate(text,text,bigint,uuid) owner to ed_delivery_staging_rpc;

-- Atomic multi-entity transaction: either all revisions/links commit or none.
-- Reject duplicate entities and require canonical order to avoid opposite-order deadlocks.
create or replace function public.ed_delivery_staging_batch(p_items jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_actor uuid:=auth.uid(); v_item jsonb; v_previous text:=''; v_key text; v_results jsonb:='[]'::jsonb; v_phase integer;
begin
 if v_actor is null or not exists(select 1 from ed_delivery_private.admin_members where user_id=v_actor and enabled) then
  raise exception 'not authorized' using errcode='42501';
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' then
  raise exception 'invalid batch type' using errcode='22023';
 end if;
 if jsonb_array_length(p_items) not between 1 and 100 then
  raise exception 'invalid batch size' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(672045900001::bigint);
 -- Validate the complete input before any mutation.
 for v_item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(v_item) is distinct from 'object' or nullif(v_item->>'kind','') is null or nullif(v_item->>'id','') is null then
   raise exception 'invalid batch item' using errcode='22023';
  end if;
  v_key:=(v_item->>'kind')||':'||(v_item->>'id');
  if v_key collate "C" <= v_previous collate "C" then raise exception 'batch must be sorted and unique' using errcode='22023'; end if;
  v_previous:=v_key;
 end loop;
 -- UUID equality is case-insensitive; grouping the raw JSON strings would
 -- miss two textual spellings of the same operation_id.
 if exists(select 1 from jsonb_array_elements(p_items) i
   where nullif(i.value->>'operation_id','') is null) then
  raise exception 'missing operation ID in batch' using errcode='22023';
 end if;
 if exists(select 1 from jsonb_array_elements(p_items) i
   group by (i.value->>'operation_id')::uuid having count(*)>1) then
  raise exception 'duplicate operation IDs in batch' using errcode='23505';
 end if;
 -- Input remains canonically sorted, but execution must honor dependencies:
 -- warehouse default demotions, suppliers, destinations, warehouses,
 -- product associations, then drafts. All phases share one transaction.
 for v_phase in 1..6 loop
  for v_item in select value from jsonb_array_elements(p_items) loop
   if (v_phase=1 and v_item->>'kind'='warehouse' and v_item->'payload'->>'defaultForSupplier'='false')
    or (v_phase=2 and v_item->>'kind'='supplier')
    or (v_phase=3 and v_item->>'kind'='destination')
    or (v_phase=4 and v_item->>'kind'='warehouse' and
        (v_item->'payload'->>'defaultForSupplier'='false') is not true)
    or (v_phase=5 and v_item->>'kind'='product_origin')
    or (v_phase=6 and v_item->>'kind'='shipment_draft')
   then
    v_results:=v_results||jsonb_build_array(public.ed_delivery_staging_write(
     (v_item->>'operation_id')::uuid,v_item->>'kind',v_item->>'id',
     v_item->'payload',(v_item->>'expected_revision')::bigint,
     coalesce(v_item->'links','[]'::jsonb)));
   end if;
  end loop;
 end loop;
 -- Return results in the caller's canonical input order, not execution-phase
 -- order. Operation IDs are unique per request and identify each response.
 select jsonb_agg(o.response order by i.ordinality) into v_results
 from jsonb_array_elements(p_items) with ordinality as i(value,ordinality)
 join ed_delivery_private.operations o
   on o.operation_id=(i.value->>'operation_id')::uuid;
 -- Never report an atomic batch as successful if any input item was skipped.
 if coalesce(jsonb_array_length(v_results),0)<>jsonb_array_length(p_items) then
  raise exception 'batch result count mismatch' using errcode='22023';
 end if;
 return v_results;
end $$;
revoke all on function public.ed_delivery_staging_batch(jsonb) from public,anon,authenticated;
grant execute on function public.ed_delivery_staging_batch(jsonb) to authenticated;
alter function public.ed_delivery_staging_batch(jsonb) owner to ed_delivery_staging_rpc;
revoke create on schema public from ed_delivery_staging_rpc;

commit;
