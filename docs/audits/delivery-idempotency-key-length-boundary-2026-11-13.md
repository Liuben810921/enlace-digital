# Auditoría: límite de longitud de clave de idempotencia — 13 noviembre 2026

## Control de concurrencia
HEAD inicial de la rama aislada `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `263276e8388149111121d56764538c7b41c0521c`; sin cambios concurrentes detectados.

## Riesgo
La RPC de cotización debe rechazar claves de idempotencia de más de 80 caracteres antes de persistir una operación, y aceptar una clave de exactamente 80 caracteres con repetición idempotente consistente.

## Regresión reproducible
En PostgreSQL 16 desechable, la prueba comprueba que una clave de 81 caracteres produce error `22023` y no cambia el número de cotizaciones. Luego comprueba que una clave de 80 caracteres genera una única cotización y que su repetición devuelve el mismo importe sin duplicar registros. Commit de pruebas `dc1cc93ebcdba80eeb110e90abfd12fd6f292cc4`.

## Criterio de cierre
Si CI pasa, cerrar sin cambios SQL; si falla, revisar logs y corregir únicamente el defecto demostrado.

**Estado: pendiente de GitHub Actions.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
