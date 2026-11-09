-- STAGING ONLY, POST-MIGRATION, EXPLICIT APPROVAL REQUIRED.
-- Never run in production. One SQL Editor execution, BEGIN..ROLLBACK.
-- Requires BOTH reviewed proposal migrations already installed in staging.
-- NO real email, checkout or external service calls.
BEGIN;
DO $tests$
DECLARE
 a jsonb; b jsonb; login_a jsonb; login_b jsonb;
 ta text := repeat('a',64); tb text := repeat('b',64);
 hash_a text := encode(extensions.digest(ta,'sha256'),'hex');
 hash_b text := encode(extensions.digest(tb,'sha256'),'hex');
 id_a integer; id_b integer; sid uuid; recipient_id bigint;
 n integer:=0;
BEGIN
 a:=public.ed_cliente_registrar_residencia_privado(
 'Prueba Cuba Uno','+15550001001','ClaveFicticia2026!','test-cuba@example.invalid',
 'cuba','La Habana','Plaza de la Revolucion','Vedado','Calle ficticia 123');
 IF a->>'numero' IS NULL THEN RAISE EXCEPTION 'FAIL registro Cuba'; END IF; n:=n+1;
 id_a:=(a->>'numero')::integer;
 IF (SELECT direccion_habitual FROM public.clientes_oficiales WHERE numero=id_a)<>'Calle ficticia 123' THEN RAISE EXCEPTION 'FAIL direccion Cuba'; END IF; n:=n+1;
 b:=public.ed_cliente_registrar_residencia_privado(
 'Prueba Exterior Dos','+15550001002','ClaveFicticia2026!','test-ext@example.invalid',
 'extranjero','','','','');
 id_b:=(b->>'numero')::integer;
 IF id_b IS NULL OR (SELECT direccion_habitual FROM public.clientes_oficiales WHERE numero=id_b) IS NOT NULL THEN RAISE EXCEPTION 'FAIL extranjero'; END IF; n:=n+1;
 BEGIN
  PERFORM public.ed_cliente_registrar_residencia_privado(
   'Prueba Incompleta','+15550001003','ClaveFicticia2026!',NULL,'cuba','','','','');
  RAISE EXCEPTION 'FAIL Cuba sin direccion admitida';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='FAIL Cuba sin direccion admitida' THEN RAISE; END IF;
 END; n:=n+1;
 BEGIN
  PERFORM public.ed_cliente_registrar_residencia_privado(
   'Prueba Duplicada','+15550001001','ClaveFicticia2026!',NULL,'extranjero','','','','');
  RAISE EXCEPTION 'FAIL duplicado admitido';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='FAIL duplicado admitido' THEN RAISE; END IF;
 END; n:=n+1;
 IF (SELECT password_hash FROM enlace_auth.cliente_credenciales WHERE cliente_numero=id_a)='ClaveFicticia2026!' THEN RAISE EXCEPTION 'FAIL password plano'; END IF; n:=n+1;
 IF public.ed_cliente_login_privado('+15550001001','incorrecta',repeat('c',64)) IS NOT NULL THEN RAISE EXCEPTION 'FAIL password incorrecto'; END IF; n:=n+1;
 login_a:=public.ed_cliente_login_privado('+15550001001','ClaveFicticia2026!',hash_a);
 login_b:=public.ed_cliente_login_privado('+15550001002','ClaveFicticia2026!',hash_b);
 IF login_a->>'numero' IS DISTINCT FROM id_a::text OR login_b->>'numero' IS DISTINCT FROM id_b::text THEN RAISE EXCEPTION 'FAIL login'; END IF; n:=n+1;
 IF (public.ed_cliente_sesion_privada(hash_a,false)->>'numero')::integer IS DISTINCT FROM id_a THEN RAISE EXCEPTION 'FAIL perfil sesion'; END IF; n:=n+1;
 IF public.ed_cliente_direccion_privada(hash_b,'La Habana','Plaza','Vedado','Otra calle ficticia') THEN RAISE EXCEPTION 'FAIL extranjero cambio Cuba'; END IF; n:=n+1;
 IF NOT public.ed_cliente_direccion_privada(hash_a,'La Habana','Plaza','Vedado','Calle ficticia 456') THEN RAISE EXCEPTION 'FAIL cambio direccion'; END IF; n:=n+1;
 IF (SELECT direccion_habitual FROM public.clientes_oficiales WHERE numero=id_b) IS NOT NULL THEN RAISE EXCEPTION 'FAIL cruce de clientes'; END IF; n:=n+1;
 INSERT INTO public.clientes_destinatarios(cliente_numero,nombre,telefono,provincia,municipio,barrio,direccion,referencias)
 VALUES(id_a,'Receptor Ficticio','+5355512345','La Habana','Plaza','','Calle ficticia 123','') RETURNING id INTO recipient_id;
 IF (SELECT cliente_numero FROM public.clientes_destinatarios WHERE id=recipient_id)<>id_a THEN RAISE EXCEPTION 'FAIL FK destinatario'; END IF; n:=n+1;
 INSERT INTO public.clientes_direcciones_entrega(cliente_numero,nombre_receptor,telefono_receptor,provincia,municipio,direccion)
 VALUES(id_a,'Receptor Ficticio','+5355512345','La Habana','Plaza','Calle ficticia 123');
 IF NOT EXISTS(SELECT 1 FROM public.clientes_direcciones_entrega WHERE cliente_numero=id_a) THEN RAISE EXCEPTION 'FAIL direccion entrega'; END IF; n:=n+1;
 PERFORM public.ed_cliente_sesion_privada(hash_a,true);
 IF public.ed_cliente_sesion_privada(hash_a,false) IS NOT NULL THEN RAISE EXCEPTION 'FAIL replay revocado'; END IF; n:=n+1;
 UPDATE enlace_auth.cliente_sesiones SET expira_en=now()-interval '1 minute' WHERE token_hash=hash_b;
 IF public.ed_cliente_sesion_privada(hash_b,false) IS NOT NULL THEN RAISE EXCEPTION 'FAIL expiracion'; END IF; n:=n+1;
 -- Validate all five RPC privilege boundaries, including the internal helper.
 IF EXISTS (
  SELECT 1 FROM unnest(ARRAY[
   'public.ed_cliente_registrar_privado(text,text,text,text)',
   'public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text)',
   'public.ed_cliente_login_privado(text,text,text)',
   'public.ed_cliente_sesion_privada(text,boolean)',
   'public.ed_cliente_direccion_privada(text,text,text,text,text)'
  ]) AS f(signature)
  WHERE has_function_privilege('anon',f.signature,'EXECUTE')
     OR has_function_privilege('authenticated',f.signature,'EXECUTE')
 ) THEN RAISE EXCEPTION 'FAIL public RPC permissions'; END IF; n:=n+1;
 IF has_function_privilege('service_role','public.ed_cliente_registrar_privado(text,text,text,text)','EXECUTE')
 OR EXISTS (
  SELECT 1 FROM unnest(ARRAY[
   'public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text)',
   'public.ed_cliente_login_privado(text,text,text)',
   'public.ed_cliente_sesion_privada(text,boolean)',
   'public.ed_cliente_direccion_privada(text,text,text,text,text)'
  ]) AS f(signature)
  WHERE NOT has_function_privilege('service_role',f.signature,'EXECUTE')
 ) THEN RAISE EXCEPTION 'FAIL service role RPC permissions'; END IF; n:=n+1;
 RAISE NOTICE 'PASS % aserciones SQL (todos los datos ficticios se revertiran)',n;
END $tests$;
ROLLBACK;
-- Test limitations: owner isolation for recipient-save requires Edge Function
-- integration tests; SQL fixture FK checks alone do not establish API security.
