# Auditoría: límite inferior de longitud de clave de idempotencia — 13 noviembre 2026

## Control de concurrencia
HEAD inicial de la rama aislada `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `6cff5c9d3fdb0b901c515ffbc5c5c25b278c6079`; sin cambios concurrentes detectados.

## Riesgo
La RPC de cotización debe rechazar claves de idempotencia vacías sin persistencia y aceptar claves de un único carácter significativo, conservando la semántica de repetición.

## Regresión reproducible
En PostgreSQL 16 desechable, la prueba comprueba que la clave vacía produce error `22023` y no cambia el número de cotizaciones. Luego comprueba que la clave `z` genera una sola cotización y que su repetición devuelve el mismo importe sin duplicar registros. Commit de pruebas `9794850bf522b0f447cd9b1d62a7be90e5fa265f`.

## Criterio de cierre
Si CI pasa, cerrar sin cambios SQL; si falla, revisar logs y corregir únicamente el defecto demostrado.

**Estado: auditoría cerrada; CI aprobada y sin modificaciones SQL.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Evidencia de cierre

[GitHub Actions #43536253738](https://github.com/Liuben810921/enlace-digital/actions/runs/43536253738) terminó `completed/success` para el commit de pruebas `9794850bf522b0f447cd9b1d62a7be90e5fa265f`. El trabajo `test` (ID `132265859854`) terminó `completed/success`. Se verificó el rechazo de una clave vacía sin persistencia, la aceptación de una clave de un carácter y el replay sin duplicación. No se reprodujo defecto SQL; no se modificó SQL. Cierre exclusivamente documental, sin merge ni despliegue; no se detectaron cambios concurrentes antes del cierre.
