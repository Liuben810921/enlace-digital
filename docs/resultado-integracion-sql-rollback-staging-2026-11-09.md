# Resultado de pruebas SQL reales con ROLLBACK — staging — 2026-11-09

## Alcance y autorización

Proyecto exclusivamente staging `xqahthghvozeigbojhyi`. Autorizado el avance no transaccional de tres secuencias: `public.clientes_oficiales_numero_seq`, `public.clientes_destinatarios_id_seq`, `public.clientes_direcciones_entrega_id_seq`. No autorizado restablecerlas. Sin despliegues Edge, secretos, roles, producción, correos ni pedidos reales.

## Comprobaciones previas

- Commit base `643de5da53624cc6fce84888c61fee8823baf050`: GitHub Actions run `42712707689`, **success**.
- Inspección solo lectura de `pg_get_functiondef` para las seis RPC privadas, ausencia de triggers de usuario en las tablas del circuito, defaults e identity en clientes, credenciales, sesiones, destinatarios y direcciones. Se encontraron únicamente las tres secuencias de identificación autorizadas; sesiones usan `gen_random_uuid()` y las demás columnas usan defaults transaccionales (`now()`, valores constantes o NULL).

## Ejecución

- Script: `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql`.
- Se envió en una misma llamada SQL la unidad `BEGIN; DO $tests$ ... END $tests$; ROLLBACK;` sin modificaciones al contenido de pruebas. Resultado del conector SQL: **sin error**, salida `[]` (el conector no expuso el NOTICE del bloque). El bloque DO contiene aserciones que lanzan excepción ante fallo: registro Cuba/extranjero, dirección obligatoria, duplicados, longitud bcrypt, hash de contraseña, login erróneo/correcto, sesión, separación de direcciones, destinatario, revocación, expiración y permisos.
- **No se ha probado todavía la ruta HTTP/Edge ni aislamiento API real entre clientes**; estas pruebas corresponden al contrato SQL y sus datos.

## Postflight solo lectura

Consultas independientes después del ROLLBACK: `clientes_oficiales=0`, `enlace_auth.cliente_credenciales=0`, `enlace_auth.cliente_sesiones=0`, `clientes_destinatarios=0`, `clientes_direcciones_entrega=0`, `enlace_auth.solicitudes_limite=0`. Coincidencias de teléfonos ficticios `+15550001001..4`: 0. Destinatarios ficticios `Receptor Ficticio`: 0. **Sin filas persistentes de prueba**.

## Estado y siguiente etapa

Pruebas SQL transaccionales completadas y datos ficticios revertidos. No se restablecieron secuencias. Pendiente: validación de acceso HTTP desde navegador y Edge Function en staging, revisión de JWT/CORS, configuración segura y permisos de eliminación de Edge Functions **solo como requisito de despliegue**. Requiere autorización independiente para desplegar o cambiar configuración. No reabrir batería SQL salvo defecto nuevo.
