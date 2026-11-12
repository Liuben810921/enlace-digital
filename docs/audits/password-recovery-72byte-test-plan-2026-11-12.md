# Caso sintético pendiente — límite de contraseña en recuperación

Fecha: 2026-11-12. Solo documentación, sin cambios SQL ni ejecución en staging.

## Defecto confirmado por inspección
`public.ed_cliente_registrar_privado`: exige `length(password) BETWEEN 8 AND 128` y `octet_length(password) <=72`.
`enlace_auth.ed_consumir_token_correo_privado`: recuperación comprueba solo `length(password) BETWEEN 8 AND 128`; no verifica bytes antes de llamar `extensions.crypt(..., gen_salt('bf',12))`.

## Batería propuesta en PostgreSQL desechable
- 8 caracteres ASCII / 8 bytes: aceptar.
- 72 caracteres ASCII / 72 bytes: aceptar.
- 73 caracteres ASCII / 73 bytes: rechazar.
- 24 caracteres Unicode de 3 bytes / 72 bytes: aceptar.
- 25 caracteres Unicode de 3 bytes / 75 bytes: rechazar.
- 7 caracteres ASCII: rechazar.
- 129 caracteres ASCII: rechazar.
- Contraseña nueva no válida: no consumir token, no modificar hash, no revocar sesiones.
- Contraseña válida: consumir una sola vez, cambiar hash, revocar sesiones, rechazar replay.
- Ejecutar con correo simulado y configuracion_correo sintética habilitada SOLO en base desechable. Nunca consultar o mutar clientes de staging.

## Corrección propuesta, NO aplicada
En la validación inicial de `enlace_auth.ed_consumir_token_correo_privado`, para `recuperar_clave`, agregar `octet_length(p_password_nueva)>72` al rechazo. Verificar que no cambie la semántica de 8–128 caracteres y que el rechazo ocurra antes de bloquear o consumir token.

## Criterio de cierre
Tests reproducibles y exitosos en CI aislada; revisión de permisos y RLS; autorización separada para migración de staging y pruebas funcionales; ninguna activación de correo real.
