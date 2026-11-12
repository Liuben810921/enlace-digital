-- Verified pre-change definition for rollback. Staging only.
CREATE OR REPLACE FUNCTION enlace_auth.ed_consumir_token_correo_privado(p_token_hash text, p_proposito text, p_password_nueva text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t enlace_auth.cliente_correo_tokens%rowtype;
begin
 if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_proposito not in ('verificar_correo','recuperar_clave') then return false; end if;
 if p_proposito='recuperar_clave' and (p_password_nueva is null or length(p_password_nueva)<8 or length(p_password_nueva)>128) then return false; end if;
 if not exists(select 1 from enlace_auth.configuracion_correo where clave='principal' and envios_habilitados=true and ((p_proposito='verificar_correo' and verificacion_habilitada=true) or (p_proposito='recuperar_clave' and recuperacion_habilitada=true))) then return false; end if;
 select * into t from enlace_auth.cliente_correo_tokens where token_hash=p_token_hash and proposito=p_proposito and consumido_en is null and expira_en>now() and intentos<5 for update;
 if not found then return false; end if;
 if not exists(select 1 from enlace_auth.cliente_credenciales where cliente_numero=t.cliente_numero and lower(correo_recuperacion)=lower(t.correo_destino)) then return false; end if;
 if p_proposito='verificar_correo' then
  update enlace_auth.cliente_credenciales set correo_verificado_en=now(),actualizado_en=now() where cliente_numero=t.cliente_numero;
 else
  update enlace_auth.cliente_credenciales set password_hash=extensions.crypt(p_password_nueva,extensions.gen_salt('bf',12)),intentos_fallidos=0,bloqueado_hasta=null,actualizado_en=now() where cliente_numero=t.cliente_numero and correo_verificado_en is not null;
  if not found then return false; end if;
  update enlace_auth.cliente_sesiones set revocada_en=now() where cliente_numero=t.cliente_numero and revocada_en is null;
 end if;
 update enlace_auth.cliente_correo_tokens set consumido_en=now() where id=t.id;
 update enlace_auth.cliente_correo_tokens set consumido_en=now() where cliente_numero=t.cliente_numero and proposito=p_proposito and consumido_en is null;
 return true;
end $function$
;
