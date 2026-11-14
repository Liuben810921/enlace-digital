# Auditoría: límite inferior de longitud de clave de idempotencia — 13 noviembre 2026

## Control de concurrencia
HEAD inicial de la rama aislada `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `6cff5c9d3fdb0b901c515ffbc5c5c25b278c6079`; sin cambios concurrentes detectados.

## Riesgo
La RPC de cotización debe rechazar claves de idempotencia vacías sin persistencia y aceptar claves de un único carácter significativo, conservando la semántica de repetición.

## Regresión reproducible
En PostgreSQL 16 desechable, la prueba comprueba que la clave vacía produce error `22023` y no cambia el número de cotizaciones. Luego comprueba que la clave `z` genera una sola cotización y que su repetición devuelve el mismo importe sin duplicar registros. Commit de pruebas `9794850bf522b0f447cd9b1d62a7be90e5fa265f`.

## Criterio de cierre
Si CI pasa, cerrar sin cambios SQL; si falla, revisar logs y corregir únicamente el defecto demostrado.

**Estado: pendiente de GitHub Actions.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
