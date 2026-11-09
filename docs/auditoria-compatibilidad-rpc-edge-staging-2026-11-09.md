# Auditoría estática de compatibilidad RPC / Edge / esquema — PR #2

**Estado:** no ejecutado; análisis de archivos del PR y contratos, no pruebas de base de datos.

## Dependencias de las cinco RPC

1. `ed_cliente_registrar_privado`: `public.clientes_oficiales`, `enlace_auth.cliente_credenciales`, `public.clientes_oficiales_numero_seq`, `extensions.crypt` y `extensions.gen_salt`. La secuencia aún no está instalada y su propuesta START WITH 1 no es segura sin sincronización previa.
2. `ed_cliente_registrar_residencia_privado`: llama a la RPC anterior; requiere columnas `residencia`, `provincia`, `municipio`, `barrio` y `direccion_habitual`.
3. `ed_cliente_login_privado`: consulta y actualiza `enlace_auth.cliente_credenciales`, inserta en `enlace_auth.cliente_sesiones` y consulta `public.clientes_oficiales`. Depende de columnas de bloqueo y expiración y de bcrypt en `extensions`.
4. `ed_cliente_sesion_privada`: consulta sesiones no caducadas/no revocadas, une clientes oficiales y puede revocar el token. Requiere `revocada_en`, `expira_en` y datos de perfil.
5. `ed_cliente_direccion_privada`: invoca la RPC de sesión y actualiza exclusivamente el cliente derivado del token.

## Compatibilidad con Edge Function

La función Edge staging, desactivada por defecto, llama a registro, login, sesión, dirección y limitador de intentos; utiliza `service_role` para operaciones de destinatarios y direcciones. Las inserciones fijan `cliente_numero` desde la sesión; las actualizaciones por ID incluyen el mismo filtro. El script `scripts/check_staging_isolation.py` verifica ahora columnas utilizadas en las dos tablas propuestas, junto con contratos de aislamiento, privilegios propuestos y presencia de RLS.

## Hallazgos que impiden desplegar

- **Secuencia:** falta una inicialización atómica, idempotente y compatible con los IDs existentes. No ejecutar el borrador sin resolverla.
- **Migración no completamente idempotente:** `ALTER TABLE public.clientes_oficiales ADD CONSTRAINT ed_cliente_cuba_direccion_ck` carece de guardia para una ejecución repetida; podría fallar al reaplicar el esquema. Requiere revisión de catálogo y migración controlada, no una sustitución ciega.
- **Permisos de tablas nuevas:** habilitar RLS no otorga privilegios SQL. La propuesta revoca a roles públicos, pero debe comprobarse que `service_role` tenga los permisos necesarios para SELECT/INSERT/UPDATE sobre destinatarios y direcciones, y acceso a sus secuencias IDENTITY. No se asume que los privilegios predeterminados sean suficientes.
- **Semántica PL/pgSQL:** el parser CI valida solo SQL exterior. No se han compilado las funciones ni resuelto todas sus dependencias en una base aislada.
- **Aislamiento real:** las pruebas de mutación son estáticas; faltan solicitudes de dos cuentas ficticias y pruebas negativas con tokens caducados/revocados.

Se mantienen las restricciones: sin SQL con efectos, migraciones, despliegues, escrituras en Supabase, producción o fusión del PR.
