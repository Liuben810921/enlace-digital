# Verificación de CI y contador de intentos de tokens de correo

Fecha: 2026-11-12. Auditoría de solo lectura, sin datos de clientes ni modificaciones de staging.

## Evidencia CI
Captura del propietario: `synthetic-email-token-lifecycle` ejecución **#1**, commit `c258f52`, estado **success** (verde), duración **21 s**. Corresponde a PostgreSQL desechable; no valida la función real de staging.

## Hallazgo: contador `intentos`
En staging, `enlace_auth.cliente_correo_tokens` contiene columna `intentos`; la función `ed_consumir_token_correo_privado` filtra `intentos < 5`, pero **no incrementa el contador en rechazos**. La búsqueda de definiciones de funciones SQL que mencionan `cliente_correo_tokens` devolvió únicamente `ed_consumir_token_correo_privado` y `ed_emitir_token_correo_privado`. La consulta de triggers no internos de esa tabla devolvió cero. Por tanto, **no hay evidencia de un incremento de intentos dentro de la base de datos**. Una capa externa podría controlar intentos, pero no ha sido verificada; el límite de cinco intentos no debe darse por operativo extremo a extremo.

## Implicaciones y recomendación
No modificar directamente staging bajo la autorización de solo lectura. Inspeccionar el controlador/Edge Function de recuperación para determinar si registra fallos y aplica límites de solicitudes. Diseñar una prueba aislada de intentos erróneos y concurrencia. Para aplicar un cambio en la función o tablas de staging, pedir autorización independiente. La emisión de correo permanece desactivada.
