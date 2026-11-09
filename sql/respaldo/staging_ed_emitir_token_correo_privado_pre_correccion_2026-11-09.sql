-- BACKUP original definition from staging before authorized fix. For rollback only.
CREATE OR REPLACE FUNCTION enlace_auth.ed_emitir_token_correo_privado(p_proposito text, p_telefono text, p_correo text, p_token_hash text, p_sesion_hash text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_cliente enlace_auth.cliente_credenciales%rowtype; v_sesion_valida boolean;
begin
 if p_proposito not in ('verificar_correo','recuperar_clave') or p_token_hash !~ '^[0-9a-f]{64}$' or length(coalesce(p_correo,''))>254 then return false; end if;
 if not exists(select 1 from enlace_auth.configuracion_correo where clave='principal' and envios_habilitados=true and ((p_proposito='verificar_correo' and verificacion_habilitada=true) or (p_proposito='recuperar_clave' and recuperacion_habilitada=true))) then return false; end if;
 select * into v_cliente from enlace_auth.cliente_credenciales where telefono_e164=p_telefono and lower(correo_recuperacion)=lower(p_correo) for update;
 if not found then return false; end if;
 if p_proposito='verificar_correo' then
  select exists(select 1 from enlace_auth.cliente_sesiones where cliente_numero=v_cliente.cliente_numero and token_hash=p_sesion_hash and expira_en>now() and revocada_en is null) into v_sesion_valida;
  if not v_sesion_valida or v_cliente.correo_verificado_en is not null then return false; end if;
 else
  if v_cliente.correo_verificado_en is null then return false; end if;
 end if;
 if exists(select 1 from enlace_auth.cliente_correo_tokens where cliente_numero=v_cliente.cliente_numero and proposito=p_proposito and creado_en>now()-interval '10 minutes' and consumido_en is null) then return false; end if;
 update enlace_auth.cliente_correo_tokens set consumido_en=now() where cliente_numero=v_cliente.cliente_numero and proposito=p_proposito and consumido_en is null;
 insert into enlace_auth.cliente_correo_tokens(cliente_numero,proposito,token_hash,correo_destino,expira_en)
 values(v_cliente.cliente_numero,p_proposito,p_token_hash,v_cliente.correo_recuperacion,now()+case when p_proposito='recuperar_clave' then interval '20 minutes' else interval '24 hours' end);
 return true;
end $function$
;
