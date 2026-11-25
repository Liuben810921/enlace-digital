-- STAGING READ-ONLY PREFLIGHT. Does not create, update or delete data.
SELECT current_database() AS db, current_user AS executor,
 to_regclass('public.clientes_oficiales_numero_seq') IS NOT NULL AS has_customer_sequence,
 EXISTS(SELECT 1 FROM pg_extension WHERE extname='pgcrypto') AS has_pgcrypto,
 (SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto') AS crypto_schema,
 to_regclass('public.clientes_destinatarios') IS NOT NULL AS has_recipients,
 to_regclass('public.clientes_direcciones_entrega') IS NOT NULL AS has_delivery_addresses,
 (SELECT count(*) FROM public.clientes_oficiales) AS existing_customers;
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS signature,
 p.prosecdef AS security_definer
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'ed_cliente_%privad%'
 ORDER BY p.proname;
