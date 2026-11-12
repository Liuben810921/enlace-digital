# Propuesta de corrección de recuperación de contraseña: límite bcrypt de 72 bytes

Fecha: 2026-11-12. **Documento de diseño, no migración ejecutable.** No se ha modificado Supabase.

## Hallazgo y alcance
La función real `enlace_auth.ed_consumir_token_correo_privado` validaba la nueva contraseña mediante longitud de caracteres (8–128) pero sin límite de 72 bytes UTF-8. La función de registro ya aplica `octet_length <= 72`. Bcrypt procesa como máximo 72 bytes, por lo que la política debe ser uniforme.

## Cambio mínimo propuesto (fragmento conceptual)
En la rama de recuperación, **antes** de buscar, bloquear o consumir el token, modificar la condición existente de rechazo para añadir:

```sql
OR octet_length(p_password_nueva) > 72
```

Mantener intactos los requisitos de 8–128 caracteres y la validación de NULL; preservar mensajes genéricos, cooldown, TTL, bloqueo y consumo atómico de token, rollback, revocación de sesiones y privilegios mínimos. **No ejecutar este fragmento como una migración independiente:** requiere inspección y revisión del cuerpo completo de la función real y una migración autorizada posteriormente.

## Pruebas aisladas reproducibles
`psql -X -v ON_ERROR_STOP=1 -f sql/pruebas/password_recovery_72bytes_isolated.sql` contra PostgreSQL 17 desechable con pgcrypto. Casos: ASCII 7/8/72/73/129; Unicode 7/8/24/25 caracteres; NULL; token inválido; replay; hash no modificado en rechazos; token no consumido en rechazos; sesiones no revocadas en rechazos; éxito actualiza hash, consume token y revoca sesiones.

## Límites de la evidencia
El prototipo es una simplificación funcional y no demuestra que el SQL real esté corregido. La ejecución #3 del commit 3d6d594 pasó según captura del propietario; las pruebas ampliadas del commit 8a73867 requieren resultado CI propio.

## Despliegue y reversión (solo propuesta, NO autorizado)
1. Exportar y revisar definición y privilegios actuales; conservar copia para rollback.
2. Aplicar cambio mínimo solo a staging mediante migración versionada tras autorización expresa.
3. Ejecutar pruebas de regresión en staging con datos ficticios y verificar permisos EXECUTE, search_path, RLS y no exposición pública.
4. Ante fallo, restaurar definición anterior desde copia auditada y repetir comprobaciones.
5. Producción requiere autorización independiente y ventana de cambio; nunca incluir datos ni secretos reales en artefactos CI.
