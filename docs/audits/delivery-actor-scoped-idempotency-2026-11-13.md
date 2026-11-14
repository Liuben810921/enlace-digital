# Auditoría: aislamiento de claves de idempotencia entre gestores — 13 noviembre 2026

## Control de concurrencia
HEAD inicial de la rama aislada `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `5a593c8cdbcca55713df05cbf9e9daf34926526d`; sin cambios concurrentes detectados.

## Riesgo
Dos gestores autenticados pueden usar legítimamente la misma clave opaca de idempotencia para operaciones distintas. La clave debe estar aislada por actor, y la política RLS debe impedir que un gestor consulte la cotización del otro.

## Regresión reproducible
En PostgreSQL 16 desechable, dos gestores cotizan sus respectivas cestas con la misma clave `actor-scoped-same-key`. Se exige que ambas operaciones se confirmen, que cada repetición devuelva su propio importe, que existan dos registros con actores y cestas distintos, y que cada gestor vea solo el suyo mediante RLS. Commit de pruebas `74207b4c0e2682bad4aa3e6c9e0ea5d30ba7a43e`.

## Criterio de cierre
Si CI pasa, cerrar sin cambios SQL; si falla, revisar logs y corregir únicamente el defecto demostrado.

**Estado: pendiente de GitHub Actions.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
