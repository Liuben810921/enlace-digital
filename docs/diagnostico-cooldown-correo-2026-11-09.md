# Diagnóstico del cooldown de correo — staging

Fecha: 2026-11-09. Base: revisión de `pg_get_functiondef` en proyecto staging `xqahthghvozeigbojhyi`. Sin cambios SQL ni producción.

## Hallazgo estático confirmado

En `enlace_auth.ed_emitir_token_correo_privado` la condición de bloqueo de emisión exige simultáneamente `creado_en > now()-interval '10 minutes'` y `consumido_en is null`. Un token emitido hace menos de diez minutos deja de bloquear nuevas emisiones cuando se consume. La implementación **no garantiza** diez minutos entre emisiones para el mismo cliente y propósito. Esto confirma un defecto de lógica respecto a la política esperada, pero no sustituye una prueba dinámica.

## Estado de las pruebas

La batería de 18 aserciones está en `sql/staging_correo_integral_rollback.sql`. Su aserción 11 cubre el caso. No se ha ejecutado por el bloqueo previo del ejecutor; no marcar como PASS ni FAIL dinámico. La prueba debe ejecutarse por un operador autorizado en una sola sesión, con `ROLLBACK`, tras verificar el aislamiento y la ausencia de envío real.

## Corrección candidata, no aplicada

Para imponer cooldown independiente del consumo, evaluar la eliminación del predicado `AND consumido_en IS NULL` **solo de la comprobación de cooldown**, manteniendo por separado la invalidación de tokens pendientes. Antes de desplegar, evaluar el efecto sobre reintentos y UX y probar concurrencia y aserciones 1–18. La propuesta no altera datos ni funciones en esta rama.

## Controles

Staging y producción permanecen separados. No habilitar SMTP, correo ni pedidos reales. No ejecutar migraciones o pruebas dinámicas bloqueadas por controles. Consultas de lectura previas verificaron que staging tenía cero clientes, credenciales, tokens, sesiones y registros de rate limit, y los tres flags de correo desactivados.
