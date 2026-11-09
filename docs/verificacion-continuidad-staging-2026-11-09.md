# Verificación de continuidad de staging — 2026-11-09

Después del commit `83d8230`, se ejecutaron consultas de **solo lectura** contra el proyecto de staging `xqahthghvozeigbojhyi`.

## Resultado verificado
- `public.clientes_oficiales`: 0 filas.
- `enlace_auth.cliente_credenciales`: 0 filas.
- `enlace_auth.cliente_correo_tokens`: 0 filas.
- `enlace_auth.cliente_sesiones`: 0 filas.
- `enlace_auth.solicitudes_limite`: 0 filas.
- `configuracion_correo`: `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`.
- Seis tablas auditadas tienen RLS habilitada. `anon`, `authenticated` y `service_role` no poseen permiso SELECT directo sobre ninguna de esas seis tablas.
- Se comprobó que el archivo `sql/staging_correo_integral_rollback.sql` sigue disponible en GitHub (8026 caracteres).

## Estado de pruebas
Las 18 aserciones del archivo están **preparadas, no ejecutadas**. Las consultas anteriores NO equivalen a una prueba funcional de tokens. Un intento previo de invocar funciones reales fue bloqueado; no se repitió ni eludió. La ejecución autorizada debe mantener la transacción completa en una sesión, capturar resultados y terminar con ROLLBACK. Antes de cualquier ejecución, verificar que no hay infraestructura de envío conectada y que el proyecto es staging.

## Próxima decisión
Solicitar ejecución por un operador autorizado del entorno de staging y recepción de la tabla PASS/FAIL. Investigar la aserción 11 (cooldown después de consumo), prevista como fallo según lectura del código. No tocar producción ni habilitar correo/pedidos reales.
