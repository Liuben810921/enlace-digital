# ENLACE DIGITAL — auditoría de aislamiento, errores y cancelación (18 noviembre 2026)

Base `86a7ac737149f34d8d82074adfd09132ff893a3c`. Rama `plan/havana-osrm-benchmark-offline-20261114`.

## Verificación
Se releyeron de GitHub el ejecutor y los scripts A/B. Se verificó por inspección el flujo de dos conexiones y el sondeo `pg_blocking_pids`. Parser V8 aplicado al JavaScript publicado: **PASS**. Blob verificado: `bd73c332d6f1bbd5aacca629fa96d3d344fc174f`.

## Defectos corregidos
1. El ejecutor comprobaba igualdad de base pero no impedía usar la misma identidad para DBA y pool. Ahora exige `session_user` distinto.
2. La cancelación intentaba SIGTERM repetidamente sobre procesos ya marcados como terminados; se evita repetir la señal.
3. Los errores síncronos incluían stderr sin depuración, con riesgo de mostrar detalles de conexión; ahora se limita el mensaje a estado y condición de error.

## Bloqueantes detectados por inspección, no resueltos
- **Preaprovisionamiento de roles**: el runner abre `LAB_POOL_URL` antes de ejecutar `atomic_disposable_roles.sql`, pero este script crea `ed_intent_test_pool`. Si el pool apunta a ese login y todavía no existe, la prevalidación falla; si ya existe, el `CREATE ROLE` del fixture falla. Se requiere separar la creación de roles del runner o hacer el fixture idempotente con verificación estricta de atributos. No se cambió DDL sin prueba de PostgreSQL.
- `CREATE ROLE` es global al clúster, no queda aislado por una base desechable; debe usarse un clúster PostgreSQL entero desechable y aislado, no simplemente una base temporal en un servidor compartido.
- Los procesos hijos reciben SIGTERM, pero no hay escalada forzosa ni espera garantizada de su terminación en errores tempranos. El sondeo usa `spawnSync` con timeout 30 s, que puede exceder la ventana de observación.
- Las sesiones A/B están limitadas a 35 s y el sondeo espera 9 s; la prueba de bloqueo sigue sin ejecutarse.

## Ejecuciones
- Parser V8: **realizado, PASS**.
- PostgreSQL: **0**.
- psql: **0**.
- Runner Node como proceso: **0**.
- GitHub Actions, Supabase, staging, producción, pedidos reales, descargas y despliegues: **ninguno**.

**Estado:** material publicado, ejecución integrada **BLOQUEADA** por preaprovisionamiento de roles y ausencia de validación PostgreSQL. No atribuir resultados de seguridad ni comerciales.
