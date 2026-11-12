# Ejecución controlada de corrección de 72 bytes en Supabase staging

Fecha: 2026-11-12. Proyecto staging: `xqahthghvozeigbojhyi`. Producción no modificada.

## Respaldo anterior al cambio
Definición original completa: `sql/rollback/staging_email_recovery_pre72bytes_20261112.sql`, commit `174620139150f75338c24b58540e7a1b4c33b0a3`. Incluye `CREATE OR REPLACE FUNCTION` para reversión, sin datos personales ni secretos. Antes del cambio se confirmó owner `postgres`, `SECURITY DEFINER`, `search_path=''` y ACL EXECUTE para `postgres` y `service_role`.

## Aplicación
Migración aplicada satisfactoriamente por conector Supabase: `staging_recovery_password_72byte_guard_20261112` (respuesta `success:true`). Único cambio de lógica: en la validación inicial de la rama `recuperar_clave`, añadir `or octet_length(p_password_nueva)>72`. Sin cambios en otras ramas, tablas, permisos ni configuración de correo.

## Verificaciones posteriores (consultas SQL)
- `guard_present=true` mediante `pg_get_functiondef`.
- `anon_exec=false`, `auth_exec=false`, `service_exec=true`.
- `owner=postgres`, `security_definer=true`, `search_path=''`.
- `ascii_boundary=true` (72 bytes), `ascii_reject=true` (73 bytes).
- `unicode_boundary=true` (24 caracteres € =72 bytes), `unicode_reject=true` (25 caracteres € =75 bytes).
- `reject_73_without_token=true`, `reject_unicode_without_token=true`, `unknown_token_rejected=true` usando token inexistente sintético.

No se insertaron clientes, no se enviaron correos y no se activaron servicios ni pedidos. Estas pruebas no demuestran un flujo de recuperación exitoso extremo a extremo con token real; eso requiere pruebas separadas controladas.

## Reversión si se detecta regresión
Revisar el respaldo GitHub, verificar que corresponde a la versión anterior, ejecutar su `CREATE OR REPLACE FUNCTION` en **staging exclusivamente** tras evaluación de impacto y autorización si corresponde, y volver a comprobar ACL, owner, search_path, y flujo. No restaurar en producción.
