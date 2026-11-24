-- Solución para el rol RPC personalizado sin acceso al esquema auth.
-- Supabase hosted: postgres no puede conceder USAGE en auth porque el esquema
-- pertenece a supabase_admin. El helper SECURITY DEFINER es propiedad de
-- postgres y devuelve únicamente el UUID de auth.uid() del JWT de esta llamada.
-- Las RPC v2 también son propiedad de postgres; cada copia conserva el control
-- explícito de admin_members. Nunca exponerlas a PUBLIC ni anon.
begin;

create or replace function ed_delivery_private.current_uid()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
 select auth.uid()
$$;
revoke all on function ed_delivery_private.current_uid() from public, anon, authenticated, ed_delivery_staging_rpc;

do $migration$
declare
 v_source regprocedure;
 v_target text;
 v_definition text;
 v_old_name text;
 v_new_name text;
begin
 for v_source, v_target, v_old_name, v_new_name in
  select x.source::regprocedure, x.target, x.old_name, x.new_name
  from (values
   ('public.ed_delivery_staging_read()', 'public.ed_delivery_staging_read_v2', 'public.ed_delivery_staging_read(', 'public.ed_delivery_staging_read_v2('),
   ('public.ed_delivery_staging_write(uuid,text,text,jsonb,bigint,jsonb)', 'public.ed_delivery_staging_write_v2', 'public.ed_delivery_staging_write(', 'public.ed_delivery_staging_write_v2('),
   ('public.ed_delivery_staging_deactivate(text,text,bigint,uuid)', 'public.ed_delivery_staging_deactivate_v2', 'public.ed_delivery_staging_deactivate(', 'public.ed_delivery_staging_deactivate_v2('),
   ('public.ed_delivery_staging_batch(jsonb)', 'public.ed_delivery_staging_batch_v2', 'public.ed_delivery_staging_batch(', 'public.ed_delivery_staging_batch_v2(')
  ) as x(source,target,old_name,new_name)
 loop
  v_definition:=pg_get_functiondef(v_source);
  if position('auth.uid()' in v_definition)=0
    or position('ed_delivery_private.admin_members' in v_definition)=0
    or position('enabled' in v_definition)=0
    or position('SECURITY DEFINER' in upper(v_definition))=0
    or position('SET search_path TO ''''' in v_definition)=0 then
   raise exception 'source RPC is missing required auth, allowlist, or search_path guard: %',v_source;
  end if;
  v_definition:=replace(v_definition,'auth.uid()','ed_delivery_private.current_uid()');
  v_definition:=replace(v_definition,v_old_name,v_new_name||'(');
  if v_target='public.ed_delivery_staging_batch_v2' then
   v_definition:=replace(v_definition,'public.ed_delivery_staging_write(','public.ed_delivery_staging_write_v2(');
  end if;
  execute v_definition;
 end loop;
end
$migration$;


revoke all on function public.ed_delivery_staging_read_v2() from public, anon, authenticated;
revoke all on function public.ed_delivery_staging_write_v2(uuid,text,text,jsonb,bigint,jsonb) from public, anon, authenticated;
revoke all on function public.ed_delivery_staging_deactivate_v2(text,text,bigint,uuid) from public, anon, authenticated;
revoke all on function public.ed_delivery_staging_batch_v2(jsonb) from public, anon, authenticated;

grant execute on function public.ed_delivery_staging_read_v2() to authenticated;
grant execute on function public.ed_delivery_staging_write_v2(uuid,text,text,jsonb,bigint,jsonb) to authenticated;
grant execute on function public.ed_delivery_staging_deactivate_v2(text,text,bigint,uuid) to authenticated;
grant execute on function public.ed_delivery_staging_batch_v2(jsonb) to authenticated;

commit;
