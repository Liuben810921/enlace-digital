# ENLACE DIGITAL — ejecutor local de dos sesiones PostgreSQL (offline)
Fecha: 2026-11-18. Base `d5e5e69ac87fc06f7153568dbd5896c965c3f4e1`. Comparación inicial de rama: identical.

## Archivos publicados
- `experiments/havana-delivery-quote/postgres-lab/atomic_two_session_runner.js`: coordinador Node que ejecuta psql en dos procesos independientes, comprueba salidas A/B, estado persistente y replay.
- `atomic_postconditions_assert.sql`: corregido el delimitador `DO $$` (anteriormente `DO $`, error sintáctico verificable por inspección).
- `atomic_session_A_commit.sql`, `atomic_session_A_rollback.sql`, `atomic_session_B.sql`, `atomic_revocation_fixture.sql`, `atomic_permission_assertions.sql`: reutilizados.

## Uso FUTURO por operador, no ejecutado aquí
Se requiere Node >=18 y PostgreSQL/psql ya instalados, base PostgreSQL local nueva, vacía y descartable, y dos conexiones separadas. El runner exige URLs de conexión `LAB_ADMIN_URL` y `LAB_POOL_URL` apuntando a `localhost`, `127.0.0.1` o `::1`. Nunca introducir URLs de Supabase, staging ni producción. El operador establece variables localmente, sin subirlas a GitHub.

`node atomic_two_session_runner.js approve commit`
`node atomic_two_session_runner.js approve rollback`
`node atomic_two_session_runner.js revoke commit`
`node atomic_two_session_runner.js revoke rollback`

**Cada invocación exige una base nueva**, porque el ejecutor falla si encuentra esquemas `ed_delivery_lab` o `ed_delivery_intent_lab`. Las conexiones deben permitir `SET ROLE ed_intent_pool` en el login de pruebas.

El ejecutor instala SQL sintético, valida privilegios, identifica la intención sin suponer IDs, inicia A, espera su resultado y lanza B mientras A mantiene la transacción abierta. Comprueba resultados esperados: COMMIT → A `LAB_APPLIED_ONLY`, B `PENDIENTE`; ROLLBACK → A imprime `LAB_APPLIED_ONLY` pero revierte, B `LAB_APPLIED_ONLY`. Verifica una única intención consumida y el efecto final; replay → `PENDIENTE`.

## Limitaciones importantes
- **No ejecutado**: no se dispuso de motor PostgreSQL ni se invocó psql/Node; no existen resultados de prueba de base de datos.
- El disparo de B depende de que A emita su salida antes de terminar `pg_sleep(8)`; no es una barrera transaccional garantizada. El runner detecta fallos de salida, pero todavía no certifica tiempo de bloqueo ni cobertura exhaustiva de interleavings.
- La inspección estática no certifica que el SQL compile, que permisos sean efectivos o que el flujo del gateway real sea seguro.
- Los escenarios de conflicto de intención y privilegios negativos continúan en archivos complementarios y no están automatizados dentro del runner.
- La prueba solo valida el laboratorio ficticio. No habilita aprobación comercial ni sustituye una auditoría de seguridad.
- Si el runner falla a mitad de instalación, desechar la base. No ejecutar contra una base reutilizable.

**Estado:** código publicado, 0 ejecuciones PostgreSQL, 0 ejecuciones del runner. Opción C `PENDIENTE`. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
