-- DRAFT ONLY: DO NOT EXECUTE. STAGING PROJECT xqahthghvozeigbojhyi.
-- Requires prior review of staging_registro_destinatarios_no_ejecutar.sql,
-- sequence/extension availability, RPC contracts and explicit deployment approval.
-- SECURITY DEFINER and service_role-only grants are intentional.
-- No data migrations, deployment or production changes performed.
BEGIN;
CREATE OR REPLACE FUNCTION public.ed_cliente_registrar_privado(
 p_nombre text,p_telefono text,p_password text,p_correo text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE n integer; h text; correo text;
BEGIN
 IF array_length(regexp_split_to_array(btrim(coalesce(p_nombre,'')), '[[:space:]]+'),1)<2
    OR length(btrim(coalesce(p_nombre,'')))>150 THEN RAISE EXCEPTION 'Nombre y apellido requeridos'; END IF;
 IF p_telefono IS NULL OR p_telefono !~ ('^[+][1-9][0-9]{7,14}' || chr(36)) THEN RAISE EXCEPTION 'Telefono invalido'; END IF;
 IF length(coalesce(p_password,'')) NOT BETWEEN 8 AND 128 THEN RAISE EXCEPTION 'Contrasena invalida'; END IF;
 correo:=nullif(lower(btrim(p_correo)),'');
 IF correo IS NOT NULL AND (correo !~ ('^[^ @]+@[^ @]+[.][^ @]+' || chr(36)) OR length(correo)>254) THEN RAISE EXCEPTION 'Correo invalido'; END IF;
 IF EXISTS(SELECT 1 FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono)
 OR EXISTS(SELECT 1 FROM public.clientes_oficiales WHERE telefono=p_telefono) THEN RAISE EXCEPTION 'Telefono ya registrado'; END IF;
 n:=nextval('public.clientes_oficiales_numero_seq');
 INSERT INTO public.clientes_oficiales(numero,codigo,nombre,telefono,correo,estado)
 VALUES(n,'ED-'||lpad(n::text,6,'0'),btrim(p_nombre),p_telefono,correo,'pendiente_activacion');
 h:=extensions.crypt(p_password,extensions.gen_salt('bf',12));
 INSERT INTO enlace_auth.cliente_credenciales(cliente_numero,telefono_e164,password_hash,correo_recuperacion)
 VALUES(n,p_telefono,h,correo);
 RETURN jsonb_build_object('numero',n,'codigo','ED-'||lpad(n::text,6,'0'));
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_registrar_residencia_privado(
 p_nombre text,p_telefono text,p_password text,p_correo text,p_residencia text,
 p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE result jsonb; n integer;
BEGIN
 IF p_residencia NOT IN ('cuba','extranjero') OR p_residencia IS NULL THEN RAISE EXCEPTION 'Residencia invalida'; END IF;
 IF p_residencia='cuba' AND (length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8) THEN RAISE EXCEPTION 'Direccion habitual requerida'; END IF;
 result:=public.ed_cliente_registrar_privado(p_nombre,p_telefono,p_password,p_correo);
 n:=(result->>'numero')::integer;
 UPDATE public.clientes_oficiales SET residencia=p_residencia,
 provincia=CASE WHEN p_residencia='cuba' THEN btrim(p_provincia) END,
 municipio=CASE WHEN p_residencia='cuba' THEN btrim(p_municipio) END,
 barrio=CASE WHEN p_residencia='cuba' THEN btrim(coalesce(p_barrio,'')) END,
 direccion_habitual=CASE WHEN p_residencia='cuba' THEN btrim(p_direccion) END
 WHERE numero=n;
 RETURN result;
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_login_privado(
 p_telefono text,p_password text,p_token_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record; client record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Token invalido'; END IF;
 SELECT * INTO c FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono FOR UPDATE;
 IF NOT FOUND THEN PERFORM extensions.crypt(coalesce(p_password,''),extensions.gen_salt('bf',10)); RETURN NULL; END IF;
 IF c.bloqueado_hasta IS NOT NULL AND c.bloqueado_hasta>now() THEN RETURN NULL; END IF;
 IF c.password_hash IS NULL OR extensions.crypt(coalesce(p_password,''),c.password_hash) IS DISTINCT FROM c.password_hash THEN
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=intentos_fallidos+1,
 bloqueado_hasta=CASE WHEN intentos_fallidos+1>=5 THEN now()+interval '15 minutes' ELSE NULL END,
 actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 RETURN NULL;
 END IF;
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=0,bloqueado_hasta=NULL,actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 INSERT INTO enlace_auth.cliente_sesiones(cliente_numero,token_hash,expira_en)
 VALUES(c.cliente_numero,p_token_hash,now()+interval '30 days');
 SELECT * INTO client FROM public.clientes_oficiales WHERE numero=c.cliente_numero;
 RETURN jsonb_build_object('numero',client.numero,'codigo',client.codigo,'nombre',client.nombre,'residencia',client.residencia);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_sesion_privada(
 p_token_hash text,p_revocar boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
 SELECT s.cliente_numero,c0.codigo,c0.nombre,c0.residencia,c0.telefono,c0.correo,c0.provincia,c0.municipio,c0.barrio,c0.direccion_habitual
 INTO c FROM enlace_auth.cliente_sesiones s JOIN public.clientes_oficiales c0 ON c0.numero=s.cliente_numero
 WHERE s.token_hash=p_token_hash AND s.expira_en>now() AND s.revocada_en IS NULL FOR UPDATE OF s;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_revocar THEN UPDATE enlace_auth.cliente_sesiones SET revocada_en=now() WHERE token_hash=p_token_hash; RETURN jsonb_build_object('cerrada',true); END IF;
 RETURN jsonb_build_object('numero',c.cliente_numero,'codigo',c.codigo,'nombre',c.nombre,'residencia',c.residencia,'telefono',c.telefono,'correo',c.correo,'provincia',c.provincia,'municipio',c.municipio,'barrio',c.barrio,'direccion_habitual',c.direccion_habitual);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_direccion_privada(
 p_token_hash text,p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c jsonb;
BEGIN
 c:=public.ed_cliente_sesion_privada(p_token_hash,false);
 IF c IS NULL OR c->>'residencia'<>'cuba' THEN RETURN false; END IF;
 IF length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8 OR length(coalesce(p_provincia,''))>100 OR length(coalesce(p_municipio,''))>100 OR length(coalesce(p_barrio,''))>150 OR length(coalesce(p_direccion,''))>500 THEN RETURN false; END IF;
 UPDATE public.clientes_oficiales SET provincia=btrim(p_provincia),municipio=btrim(p_municipio),
 barrio=btrim(coalesce(p_barrio,'')),direccion_habitual=btrim(p_direccion)
 WHERE numero=(c->>'numero')::integer;
 RETURN FOUND;
END $fn$;
-- No public client role may invoke these privileged RPCs.
REVOKE ALL ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 TO service_role;
COMMIT;
 THEN RAISE EXCEPTION 'Telefono invalido'; END IF;
 IF length(coalesce(p_password,'')) NOT BETWEEN 8 AND 128 THEN RAISE EXCEPTION 'Contrasena invalida'; END IF;
 correo:=nullif(lower(btrim(p_correo)),'');
 IF correo IS NOT NULL AND (correo !~ ('^[^ @]+@[^ @]+[.][^ @]+' || chr(36)) OR length(correo)>254) THEN RAISE EXCEPTION 'Correo invalido'; END IF;
 IF EXISTS(SELECT 1 FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono)
 OR EXISTS(SELECT 1 FROM public.clientes_oficiales WHERE telefono=p_telefono) THEN RAISE EXCEPTION 'Telefono ya registrado'; END IF;
 n:=nextval('public.clientes_oficiales_numero_seq');
 INSERT INTO public.clientes_oficiales(numero,codigo,nombre,telefono,correo,estado)
 VALUES(n,'ED-'||lpad(n::text,6,'0'),btrim(p_nombre),p_telefono,correo,'pendiente_activacion');
 h:=extensions.crypt(p_password,extensions.gen_salt('bf',12));
 INSERT INTO enlace_auth.cliente_credenciales(cliente_numero,telefono_e164,password_hash,correo_recuperacion)
 VALUES(n,p_telefono,h,correo);
 RETURN jsonb_build_object('numero',n,'codigo','ED-'||lpad(n::text,6,'0'));
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_registrar_residencia_privado(
 p_nombre text,p_telefono text,p_password text,p_correo text,p_residencia text,
 p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE result jsonb; n integer;
BEGIN
 IF p_residencia NOT IN ('cuba','extranjero') OR p_residencia IS NULL THEN RAISE EXCEPTION 'Residencia invalida'; END IF;
 IF p_residencia='cuba' AND (length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8) THEN RAISE EXCEPTION 'Direccion habitual requerida'; END IF;
 result:=public.ed_cliente_registrar_privado(p_nombre,p_telefono,p_password,p_correo);
 n:=(result->>'numero')::integer;
 UPDATE public.clientes_oficiales SET residencia=p_residencia,
 provincia=CASE WHEN p_residencia='cuba' THEN btrim(p_provincia) END,
 municipio=CASE WHEN p_residencia='cuba' THEN btrim(p_municipio) END,
 barrio=CASE WHEN p_residencia='cuba' THEN btrim(coalesce(p_barrio,'')) END,
 direccion_habitual=CASE WHEN p_residencia='cuba' THEN btrim(p_direccion) END
 WHERE numero=n;
 RETURN result;
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_login_privado(
 p_telefono text,p_password text,p_token_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record; client record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Token invalido'; END IF;
 SELECT * INTO c FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono FOR UPDATE;
 IF NOT FOUND THEN PERFORM extensions.crypt(coalesce(p_password,''),extensions.gen_salt('bf',10)); RETURN NULL; END IF;
 IF c.bloqueado_hasta IS NOT NULL AND c.bloqueado_hasta>now() THEN RETURN NULL; END IF;
 IF c.password_hash IS NULL OR extensions.crypt(coalesce(p_password,''),c.password_hash) IS DISTINCT FROM c.password_hash THEN
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=intentos_fallidos+1,
 bloqueado_hasta=CASE WHEN intentos_fallidos+1>=5 THEN now()+interval '15 minutes' ELSE NULL END,
 actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 RETURN NULL;
 END IF;
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=0,bloqueado_hasta=NULL,actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 INSERT INTO enlace_auth.cliente_sesiones(cliente_numero,token_hash,expira_en)
 VALUES(c.cliente_numero,p_token_hash,now()+interval '30 days');
 SELECT * INTO client FROM public.clientes_oficiales WHERE numero=c.cliente_numero;
 RETURN jsonb_build_object('numero',client.numero,'codigo',client.codigo,'nombre',client.nombre,'residencia',client.residencia);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_sesion_privada(
 p_token_hash text,p_revocar boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
 SELECT s.cliente_numero,c0.codigo,c0.nombre,c0.residencia,c0.telefono,c0.correo,c0.provincia,c0.municipio,c0.barrio,c0.direccion_habitual
 INTO c FROM enlace_auth.cliente_sesiones s JOIN public.clientes_oficiales c0 ON c0.numero=s.cliente_numero
 WHERE s.token_hash=p_token_hash AND s.expira_en>now() AND s.revocada_en IS NULL FOR UPDATE OF s;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_revocar THEN UPDATE enlace_auth.cliente_sesiones SET revocada_en=now() WHERE token_hash=p_token_hash; RETURN jsonb_build_object('cerrada',true); END IF;
 RETURN jsonb_build_object('numero',c.cliente_numero,'codigo',c.codigo,'nombre',c.nombre,'residencia',c.residencia,'telefono',c.telefono,'correo',c.correo,'provincia',c.provincia,'municipio',c.municipio,'barrio',c.barrio,'direccion_habitual',c.direccion_habitual);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_direccion_privada(
 p_token_hash text,p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c jsonb;
BEGIN
 c:=public.ed_cliente_sesion_privada(p_token_hash,false);
 IF c IS NULL OR c->>'residencia'<>'cuba' THEN RETURN false; END IF;
 IF length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8 OR length(coalesce(p_provincia,''))>100 OR length(coalesce(p_municipio,''))>100 OR length(coalesce(p_barrio,''))>150 OR length(coalesce(p_direccion,''))>500 THEN RETURN false; END IF;
 UPDATE public.clientes_oficiales SET provincia=btrim(p_provincia),municipio=btrim(p_municipio),
 barrio=btrim(coalesce(p_barrio,'')),direccion_habitual=btrim(p_direccion)
 WHERE numero=(c->>'numero')::integer;
 RETURN FOUND;
END $fn$;
-- No public client role may invoke these privileged RPCs.
REVOKE ALL ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 TO service_role;
COMMIT;
 OR length(correo)>254) THEN RAISE EXCEPTION 'Correo invalido'; END IF;
 IF EXISTS(SELECT 1 FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono)
 OR EXISTS(SELECT 1 FROM public.clientes_oficiales WHERE telefono=p_telefono) THEN RAISE EXCEPTION 'Telefono ya registrado'; END IF;
 n:=nextval('public.clientes_oficiales_numero_seq');
 INSERT INTO public.clientes_oficiales(numero,codigo,nombre,telefono,correo,estado)
 VALUES(n,'ED-'||lpad(n::text,6,'0'),btrim(p_nombre),p_telefono,correo,'pendiente_activacion');
 h:=extensions.crypt(p_password,extensions.gen_salt('bf',12));
 INSERT INTO enlace_auth.cliente_credenciales(cliente_numero,telefono_e164,password_hash,correo_recuperacion)
 VALUES(n,p_telefono,h,correo);
 RETURN jsonb_build_object('numero',n,'codigo','ED-'||lpad(n::text,6,'0'));
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_registrar_residencia_privado(
 p_nombre text,p_telefono text,p_password text,p_correo text,p_residencia text,
 p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE result jsonb; n integer;
BEGIN
 IF p_residencia NOT IN ('cuba','extranjero') OR p_residencia IS NULL THEN RAISE EXCEPTION 'Residencia invalida'; END IF;
 IF p_residencia='cuba' AND (length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8) THEN RAISE EXCEPTION 'Direccion habitual requerida'; END IF;
 result:=public.ed_cliente_registrar_privado(p_nombre,p_telefono,p_password,p_correo);
 n:=(result->>'numero')::integer;
 UPDATE public.clientes_oficiales SET residencia=p_residencia,
 provincia=CASE WHEN p_residencia='cuba' THEN btrim(p_provincia) END,
 municipio=CASE WHEN p_residencia='cuba' THEN btrim(p_municipio) END,
 barrio=CASE WHEN p_residencia='cuba' THEN btrim(coalesce(p_barrio,'')) END,
 direccion_habitual=CASE WHEN p_residencia='cuba' THEN btrim(p_direccion) END
 WHERE numero=n;
 RETURN result;
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_login_privado(
 p_telefono text,p_password text,p_token_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record; client record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Token invalido'; END IF;
 SELECT * INTO c FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono FOR UPDATE;
 IF NOT FOUND THEN PERFORM extensions.crypt(coalesce(p_password,''),extensions.gen_salt('bf',10)); RETURN NULL; END IF;
 IF c.bloqueado_hasta IS NOT NULL AND c.bloqueado_hasta>now() THEN RETURN NULL; END IF;
 IF c.password_hash IS NULL OR extensions.crypt(coalesce(p_password,''),c.password_hash) IS DISTINCT FROM c.password_hash THEN
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=intentos_fallidos+1,
 bloqueado_hasta=CASE WHEN intentos_fallidos+1>=5 THEN now()+interval '15 minutes' ELSE NULL END,
 actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 RETURN NULL;
 END IF;
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=0,bloqueado_hasta=NULL,actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 INSERT INTO enlace_auth.cliente_sesiones(cliente_numero,token_hash,expira_en)
 VALUES(c.cliente_numero,p_token_hash,now()+interval '30 days');
 SELECT * INTO client FROM public.clientes_oficiales WHERE numero=c.cliente_numero;
 RETURN jsonb_build_object('numero',client.numero,'codigo',client.codigo,'nombre',client.nombre,'residencia',client.residencia);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_sesion_privada(
 p_token_hash text,p_revocar boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
 SELECT s.cliente_numero,c0.codigo,c0.nombre,c0.residencia,c0.telefono,c0.correo,c0.provincia,c0.municipio,c0.barrio,c0.direccion_habitual
 INTO c FROM enlace_auth.cliente_sesiones s JOIN public.clientes_oficiales c0 ON c0.numero=s.cliente_numero
 WHERE s.token_hash=p_token_hash AND s.expira_en>now() AND s.revocada_en IS NULL FOR UPDATE OF s;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_revocar THEN UPDATE enlace_auth.cliente_sesiones SET revocada_en=now() WHERE token_hash=p_token_hash; RETURN jsonb_build_object('cerrada',true); END IF;
 RETURN jsonb_build_object('numero',c.cliente_numero,'codigo',c.codigo,'nombre',c.nombre,'residencia',c.residencia,'telefono',c.telefono,'correo',c.correo,'provincia',c.provincia,'municipio',c.municipio,'barrio',c.barrio,'direccion_habitual',c.direccion_habitual);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_direccion_privada(
 p_token_hash text,p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c jsonb;
BEGIN
 c:=public.ed_cliente_sesion_privada(p_token_hash,false);
 IF c IS NULL OR c->>'residencia'<>'cuba' THEN RETURN false; END IF;
 IF length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8 OR length(coalesce(p_provincia,''))>100 OR length(coalesce(p_municipio,''))>100 OR length(coalesce(p_barrio,''))>150 OR length(coalesce(p_direccion,''))>500 THEN RETURN false; END IF;
 UPDATE public.clientes_oficiales SET provincia=btrim(p_provincia),municipio=btrim(p_municipio),
 barrio=btrim(coalesce(p_barrio,'')),direccion_habitual=btrim(p_direccion)
 WHERE numero=(c->>'numero')::integer;
 RETURN FOUND;
END $fn$;
-- No public client role may invoke these privileged RPCs.
REVOKE ALL ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 TO service_role;
COMMIT;
 THEN RAISE EXCEPTION 'Telefono invalido'; END IF;
 IF length(coalesce(p_password,'')) NOT BETWEEN 8 AND 128 THEN RAISE EXCEPTION 'Contrasena invalida'; END IF;
 correo:=nullif(lower(btrim(p_correo)),'');
 IF correo IS NOT NULL AND (correo !~ ('^[^ @]+@[^ @]+[.][^ @]+' || chr(36)) OR length(correo)>254) THEN RAISE EXCEPTION 'Correo invalido'; END IF;
 IF EXISTS(SELECT 1 FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono)
 OR EXISTS(SELECT 1 FROM public.clientes_oficiales WHERE telefono=p_telefono) THEN RAISE EXCEPTION 'Telefono ya registrado'; END IF;
 n:=nextval('public.clientes_oficiales_numero_seq');
 INSERT INTO public.clientes_oficiales(numero,codigo,nombre,telefono,correo,estado)
 VALUES(n,'ED-'||lpad(n::text,6,'0'),btrim(p_nombre),p_telefono,correo,'pendiente_activacion');
 h:=extensions.crypt(p_password,extensions.gen_salt('bf',12));
 INSERT INTO enlace_auth.cliente_credenciales(cliente_numero,telefono_e164,password_hash,correo_recuperacion)
 VALUES(n,p_telefono,h,correo);
 RETURN jsonb_build_object('numero',n,'codigo','ED-'||lpad(n::text,6,'0'));
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_registrar_residencia_privado(
 p_nombre text,p_telefono text,p_password text,p_correo text,p_residencia text,
 p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE result jsonb; n integer;
BEGIN
 IF p_residencia NOT IN ('cuba','extranjero') OR p_residencia IS NULL THEN RAISE EXCEPTION 'Residencia invalida'; END IF;
 IF p_residencia='cuba' AND (length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8) THEN RAISE EXCEPTION 'Direccion habitual requerida'; END IF;
 result:=public.ed_cliente_registrar_privado(p_nombre,p_telefono,p_password,p_correo);
 n:=(result->>'numero')::integer;
 UPDATE public.clientes_oficiales SET residencia=p_residencia,
 provincia=CASE WHEN p_residencia='cuba' THEN btrim(p_provincia) END,
 municipio=CASE WHEN p_residencia='cuba' THEN btrim(p_municipio) END,
 barrio=CASE WHEN p_residencia='cuba' THEN btrim(coalesce(p_barrio,'')) END,
 direccion_habitual=CASE WHEN p_residencia='cuba' THEN btrim(p_direccion) END
 WHERE numero=n;
 RETURN result;
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_login_privado(
 p_telefono text,p_password text,p_token_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record; client record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Token invalido'; END IF;
 SELECT * INTO c FROM enlace_auth.cliente_credenciales WHERE telefono_e164=p_telefono FOR UPDATE;
 IF NOT FOUND THEN PERFORM extensions.crypt(coalesce(p_password,''),extensions.gen_salt('bf',10)); RETURN NULL; END IF;
 IF c.bloqueado_hasta IS NOT NULL AND c.bloqueado_hasta>now() THEN RETURN NULL; END IF;
 IF c.password_hash IS NULL OR extensions.crypt(coalesce(p_password,''),c.password_hash) IS DISTINCT FROM c.password_hash THEN
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=intentos_fallidos+1,
 bloqueado_hasta=CASE WHEN intentos_fallidos+1>=5 THEN now()+interval '15 minutes' ELSE NULL END,
 actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 RETURN NULL;
 END IF;
 UPDATE enlace_auth.cliente_credenciales SET intentos_fallidos=0,bloqueado_hasta=NULL,actualizado_en=now() WHERE cliente_numero=c.cliente_numero;
 INSERT INTO enlace_auth.cliente_sesiones(cliente_numero,token_hash,expira_en)
 VALUES(c.cliente_numero,p_token_hash,now()+interval '30 days');
 SELECT * INTO client FROM public.clientes_oficiales WHERE numero=c.cliente_numero;
 RETURN jsonb_build_object('numero',client.numero,'codigo',client.codigo,'nombre',client.nombre,'residencia',client.residencia);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_sesion_privada(
 p_token_hash text,p_revocar boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c record;
BEGIN
 IF p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
 SELECT s.cliente_numero,c0.codigo,c0.nombre,c0.residencia,c0.telefono,c0.correo,c0.provincia,c0.municipio,c0.barrio,c0.direccion_habitual
 INTO c FROM enlace_auth.cliente_sesiones s JOIN public.clientes_oficiales c0 ON c0.numero=s.cliente_numero
 WHERE s.token_hash=p_token_hash AND s.expira_en>now() AND s.revocada_en IS NULL FOR UPDATE OF s;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_revocar THEN UPDATE enlace_auth.cliente_sesiones SET revocada_en=now() WHERE token_hash=p_token_hash; RETURN jsonb_build_object('cerrada',true); END IF;
 RETURN jsonb_build_object('numero',c.cliente_numero,'codigo',c.codigo,'nombre',c.nombre,'residencia',c.residencia,'telefono',c.telefono,'correo',c.correo,'provincia',c.provincia,'municipio',c.municipio,'barrio',c.barrio,'direccion_habitual',c.direccion_habitual);
END $fn$;

CREATE OR REPLACE FUNCTION public.ed_cliente_direccion_privada(
 p_token_hash text,p_provincia text,p_municipio text,p_barrio text,p_direccion text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $fn$
DECLARE c jsonb;
BEGIN
 c:=public.ed_cliente_sesion_privada(p_token_hash,false);
 IF c IS NULL OR c->>'residencia'<>'cuba' THEN RETURN false; END IF;
 IF length(btrim(coalesce(p_provincia,'')))<2 OR length(btrim(coalesce(p_municipio,'')))<2 OR length(btrim(coalesce(p_direccion,'')))<8 OR length(coalesce(p_provincia,''))>100 OR length(coalesce(p_municipio,''))>100 OR length(coalesce(p_barrio,''))>150 OR length(coalesce(p_direccion,''))>500 THEN RETURN false; END IF;
 UPDATE public.clientes_oficiales SET provincia=btrim(p_provincia),municipio=btrim(p_municipio),
 barrio=btrim(coalesce(p_barrio,'')),direccion_habitual=btrim(p_direccion)
 WHERE numero=(c->>'numero')::integer;
 RETURN FOUND;
END $fn$;
-- No public client role may invoke these privileged RPCs.
REVOKE ALL ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 public.ed_cliente_registrar_privado(text,text,text,text),
 public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text),
 public.ed_cliente_login_privado(text,text,text),
 public.ed_cliente_sesion_privada(text,boolean),
 public.ed_cliente_direccion_privada(text,text,text,text,text)
 TO service_role;
COMMIT;
