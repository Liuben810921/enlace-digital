-- ENLACE DIGITAL: PREFLIGHT DE INTEGRACION STAGING, SOLO LECTURA.
-- No ejecuta registro/login, no crea sesiones ni modifica datos.
-- Ejecutar exclusivamente contra el proyecto staging tras comprobar project_ref.
SELECT current_database() AS db, current_user AS executor,
 to_regclass('public.clientes_destinatarios') IS NOT NULL AS has_recipients,
 to_regclass('public.clientes_direcciones_entrega') IS NOT NULL AS has_locations;
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS signature,
 p.prosecdef AS security_definer,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') AS service_execute
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'ed_cliente_%privad%'
 ORDER BY p.proname;
SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,
 has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS anon_any,
 has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS authenticated_any
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('clientes_oficiales','clientes_destinatarios','clientes_direcciones_entrega')
 ORDER BY c.relname;
SELECT table_name,column_name,data_type,is_nullable
 FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('clientes_destinatarios','clientes_direcciones_entrega')
 ORDER BY table_name,ordinal_position;
