create or replace function public.ed_geoapify_route_origin_valid(p_product_id text, p_origin_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a jsonb;
  w jsonb;
  warehouse_type text;
  supplier_id text;
  lat_value double precision;
  lon_value double precision;
begin
  if p_product_id is null or length(p_product_id) < 1 or length(p_product_id) > 160
     or p_origin_id is null or length(p_origin_id) < 1 or length(p_origin_id) > 160 then
    return null;
  end if;

  select e.payload into a
  from ed_delivery_private.entities e
  where e.kind = 'product_origin' and e.id = p_product_id;

  if a is null or jsonb_typeof(a->'warehouseIds') <> 'array'
     or not (a->'warehouseIds' ? p_origin_id)
     or not exists (
       select 1 from ed_delivery_private.links l
       where l.source_kind = 'product_origin' and l.source_id = p_product_id
         and l.target_kind = 'warehouse' and l.target_id = p_origin_id
     ) then
    return null;
  end if;

  select e.payload into w
  from ed_delivery_private.entities e
  where e.kind = 'warehouse' and e.id = p_origin_id;

  if w is null or w->>'active' = 'false' then return null; end if;
  warehouse_type := w->>'type';
  supplier_id := w->>'supplierId';

  if warehouse_type = 'proveedor' then
    if supplier_id is null
       or not exists (
         select 1 from ed_delivery_private.entities se
         where se.kind = 'supplier' and se.id = supplier_id
           and se.payload->>'active' <> 'false'
       )
       or not exists (
         select 1 from ed_delivery_private.links sl
         where sl.source_kind = 'warehouse' and sl.source_id = p_origin_id
           and sl.target_kind = 'supplier' and sl.target_id = supplier_id
       ) then
      return null;
    end if;
  elsif warehouse_type <> 'propio' then
    return null;
  end if;

  if coalesce(w->>'lat','') !~ '^-?[0-9]+(\.[0-9]+)?$'
     or coalesce(w->>'lng',w->>'lon','') !~ '^-?[0-9]+(\.[0-9]+)?$' then
    return null;
  end if;
  lat_value := (w->>'lat')::double precision;
  lon_value := coalesce(w->>'lng',w->>'lon')::double precision;
  if lat_value < 22.7 or lat_value > 23.3 or lon_value < -83.0 or lon_value > -81.9 then
    return null;
  end if;

  return jsonb_build_object('id',p_origin_id,'name',w->>'name','lat',lat_value,'lon',lon_value);
end;
$$;

revoke all on function public.ed_geoapify_route_origin_valid(text,text) from public, anon, authenticated;
grant execute on function public.ed_geoapify_route_origin_valid(text,text) to service_role;
