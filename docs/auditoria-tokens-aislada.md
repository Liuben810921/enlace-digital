# ENLACE DIGITAL — auditoría transaccional de tokens (sin activación)

Estado: prueba SQL temporal ejecutada en Supabase con `BEGIN`, tablas `TEMP`, comprobaciones `DO` y `ROLLBACK`. No se tocaron clientes ni interruptores de producción.

## Resultados
- Token caducado rechazado en simulación SQL.
- Primer consumo aceptado y segundo consumo rechazado.
- Revocación de sesiones ficticias comprobada.
- Cooldown de 10 minutos y límite de cinco intentos simulados.
- Funciones reales `ed_correo_emitir_token_servicio` y `ed_correo_consumir_token_servicio` rechazan operaciones mientras la configuración está desactivada.
- Privilegios de RPC restringidos a `service_role`.

## Riesgo detectado — contador de intentos
La función real `ed_consumir_token_correo_privado` exige `intentos < 5`, pero no incrementa `intentos` cuando el hash enviado no coincide. No se puede identificar de forma segura qué token incrementar ante un hash incorrecto sin revelar o debilitar la identificación del token. La protección efectiva de intentos debe realizarse **antes de consultar el token**, por origen y/o contexto de solicitud, con respuestas indistinguibles y control de abusos. La función pública `enlace-correo-flujos` ya llama a `ed_cliente_limite_privado` (10 solicitudes por 900 segundos para consumo); esto no sustituye una revisión contra rotación de IP y abuso distribuido.

## Pendiente antes de activar
1. Probar las funciones reales en un proyecto de staging aislado con configuración propia, clientes ficticios y reversión; **no habilitar banderas de producción**, ni siquiera temporalmente.
2. Añadir pruebas de concurrencia, caducidad, repetición, permisos y revocación real de sesiones.
3. Revisar y fortalecer los límites de intentos sin enumeración de cuentas ni tokens; corregir sólo tras pruebas de regresión.
4. Mantener envíos, verificación, recuperación y pedidos reales desactivados hasta autorización expresa.

No se modificaron las funciones SQL reales durante esta auditoría.
