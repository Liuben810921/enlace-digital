# ENLACE DIGITAL — staging independiente (2026-11-09)

Proyecto Supabase: `enlace-digital-staging` (`xqahthghvozeigbojhyi`), organización Enlace Digital, región us-east-1, presupuesto consultado: $0/mes.

## Preparación comprobada
- Proyecto creado y estado `ACTIVE_HEALTHY`.
- Migración `isolated_mail_token_harness` aplicada con éxito. Incluye exclusivamente tablas de autenticación/correo de prueba y cinco funciones SQL copiadas de las definiciones de producción; sin copiar datos personales, contraseñas ni secretos.
- Configuración de correo creada con remitente ficticio `noreply@example.invalid` y los tres interruptores desactivados.
- RPC de emisión y consumo probadas con flags apagados: ambas devolvieron `false`.
- Roles `anon` y `authenticated` sin permisos directos sobre RPC de tokens.
- Staging final: cero clientes y cero tokens, correo desactivado.

## Pruebas pendientes
Una tentativa de prueba integral transaccional con cliente ficticio, emisión, cooldown, caducidad, verificación, recuperación y revocación fue bloqueada por los controles de ejecución antes de llegar a la base de datos. No se considera ejecutada ni superada. No se alteró staging ni producción. Debe ejecutarse en un entorno autorizado con control de transacciones y pruebas reproducibles, sin mensajes reales.

## Riesgo pendiente
La función de consumo real revisa `intentos < 5` sin incrementar intentos para hashes incorrectos. El límite por origen debe revisarse contra abuso distribuido. No se ha cambiado el SQL de producción.

## Producción
Sin migraciones ni despliegues en esta fase; tres clientes conservados, pedidos reales sin activar, correo desactivado.
