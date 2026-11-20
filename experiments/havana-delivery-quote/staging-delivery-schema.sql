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
 source_kind text not null,
 source_id text not null,
 target_kind text not null,
 target_id text not null,
 primary key(source_kind,source_id,target_kind,target_id),
 foreign key(source_kind,source_id) references ed_delivery_private.entities(kind,id) on delete cascade,
 foreign key(target_kind,target_id) references ed_delivery_private.entities(kind,id) on delete restrict,
 check (
 (source_kind='warehouse' and target_kind='supplier') or
 (source_kind='product_origin' and target_kind in ('warehouse','supplier')) or
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
-- The functions are SECURITY DEFINER owned by postgres; no BYPASSRLS is claimed.
-- Their only exposed capability is narrow and gated by auth.uid() + private allowlist.
-- Ownership/role must be reviewed before deployment; fail closed on absent membership.
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
declare v_user uuid:=auth.uid(); v_old bigint; v_revision bigint; v_existing record; v_result jsonb; v_link jsonb;
begin
 if v_user is null or not exists(select 1 from ed_delivery_private.admin_members where user_id=v_user and enabled) then
  raise exception 'not authorized' using errcode='42501';
 end if;
 if p_operation_id is null or p_kind not in ('supplier','warehouse','product_origin','destination','shipment_draft') or p_id is null or length(p_id) not between 1 and 160 or jsonb_typeof(p_payload) <> 'object' or jsonb_typeof(p_links)<>'array' then
  raise exception 'invalid request' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 select * into v_existing from ed_delivery_private.operations where operation_id=p_operation_id;
 if found then
  if v_existing.actor_id<>v_user or v_existing.payload<>jsonb_build_object('kind',p_kind,'id',p_id,'payload',p_payload,'expected_revision',p_expected_revision,'links',p_links) then
   raise exception 'idempotency conflict' using errcode='23505';
  end if;
  return v_existing.response;
 end if;
 select revision into v_old from ed_delivery_private.entities where kind=p_kind and id=p_id for update;
 if p_expected_revision is distinct from coalesce(v_old,0) then
  raise exception 'revision conflict' using errcode='40001';
 end if;
 v_revision:=coalesce(v_old,0)+1;
 insert into ed_delivery_private.entities(kind,id,payload,revision) values(p_kind,p_id,p_payload,v_revision)
 on conflict(kind,id) do update set payload=excluded.payload,revision=excluded.revision,updated_at=now();
 delete from ed_delivery_private.links where source_kind=p_kind and source_id=p_id;
 for v_link in select value from jsonb_array_elements(p_links) loop
  if v_link->>'target_kind' is null or v_link->>'target_id' is null then raise exception 'invalid link' using errcode='22023'; end if;
  insert into ed_delivery_private.links(source_kind,source_id,target_kind,target_id)
  values(p_kind,p_id,v_link->>'target_kind',v_link->>'target_id');
 end loop;
 v_result:=jsonb_build_object('kind',p_kind,'id',p_id,'revision',v_revision);
 insert into ed_delivery_private.operations(operation_id,actor_id,payload,response)
 values(p_operation_id,v_user,jsonb_build_object('kind',p_kind,'id',p_id,'payload',p_payload,'expected_revision',p_expected_revision,'links',p_links),v_result);
 return v_result;
end $$;
revoke all on function public.ed_delivery_staging_read() from public,anon;
revoke all on function public.ed_delivery_staging_write(uuid,text,text,jsonb,bigint,jsonb) from public,anon;
grant execute on function public.ed_delivery_staging_read() to authenticated;
grant execute on function public.ed_delivery_staging_write(uuid,text,text,jsonb,bigint,jsonb) to authenticated;
commit;
