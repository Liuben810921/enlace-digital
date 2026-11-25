create or replace function public.ed_geoapify_route_origins_for_product(p_product_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ids jsonb;
  resolved jsonb;
begin
  if p_product_id is null or length(p_product_id) < 1 or length(p_product_id) > 160 then
    return null;
  end if;

  select e.payload->'warehouseIds' into ids
  from ed_delivery_private.entities e
  where e.kind = 'product_origin' and e.id = p_product_id;

  if ids is null or jsonb_typeof(ids) <> 'array' or jsonb_array_length(ids) < 1 or jsonb_array_length(ids) > 20 then
    return null;
  end if;

  select coalesce(jsonb_agg(v.value), '[]'::jsonb) into resolved
  from jsonb_array_elements_text(ids) as item(origin_id)
  cross join lateral (select public.ed_geoapify_route_origin_valid(p_product_id, item.origin_id) as value) v
  where v.value is not null;

  if jsonb_typeof(resolved) <> 'array' or jsonb_array_length(resolved) < 1 then
    return null;
  end if;
  return resolved;
end;
$$;

revoke all on function public.ed_geoapify_route_origins_for_product(text) from public, anon, authenticated;
grant execute on function public.ed_geoapify_route_origins_for_product(text) to service_role;
