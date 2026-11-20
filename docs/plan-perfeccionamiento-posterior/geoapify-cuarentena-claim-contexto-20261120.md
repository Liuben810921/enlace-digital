# ENLACE DIGITAL — cuarentena de reclamaciones con contexto obsoleto (2026-11-20)

Base: `8013f463a7ef2260abd91dc202b7a3bea8baeb5c`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`; comparación inicial `identical` (sin commits posteriores).

## Cambio funcional
`017_geoapify_claim_context_quarantine.sql` modifica `claim_dispatch`: toma el mismo `pg_advisory_xact_lock(7342291,1)` usado por los escritores cooperantes, bloquea el outbox, obtiene `trusted_context` y `reservation` con `FOR UPDATE`, compara revisión y digest con el outbox, y exige reserva DISPATCHED e identidad coincidente. Si cualquier comprobación falla, cambia READY a QUARANTINED y devuelve `CONTEXT_STALE_QUARANTINED` sin asignar token. QUARANTINED no vuelve a READY automáticamente.

`018_geoapify_claim_context_tests.sql` prepara pruebas rollback de cambio de revisión, cambio de digest incluso sin incremento de revisión, imposibilidad de reclamar cuarentena, rechazo de finalización sin claim, y reclamación única válida. `run_concurrency.py` incluye 017 y 018 después de los casos previos.

## Verificación ejecutada
Archivos leídos directamente desde GitHub, con blobs:
- 017: `3666023ad316db1140a3587860bb9dfea227db3d`.
- 018: `050d47098145a46a99e65ab8a9e99ac28b628364`.
- runner: `b6da75c8845338180a0a785bdf25ac8d312579c7`.

Se ejecutaron comprobaciones estructurales **13/13**: para cada SQL, BEGIN único, cierre COMMIT/ROLLBACK único, pareja de delimitadores $$, presencia de bloqueo o invocación de claim, ausencia de HTTP; para el runner, presencia de 017, de 018 y orden correcto. Estas pruebas son inspección de texto, **no ejecución SQL**.

## Riesgos y límites
- No se ejecutó PostgreSQL, SQL, carreras reales ni Node.js; no se instaló PostgreSQL.
- Los bloqueos advisory son cooperativos: acceso directo a tablas o escritores que omitan el contrato pueden eludir la sincronización. PostgreSQL documenta esa característica: https://www.postgresql.org/docs/current/explicit-locking.html
- El control se hace al reclamar. Si el contexto cambia **después** de CLAIMED y antes del envío real, sigue existiendo una ventana que debe cubrir un worker con una política de comprobación final, cancelación o conciliación. Una transacción SQL no cubre una llamada HTTP externa.
- La cuarentena conserva reservas/créditos de manera conservadora; no hay liberación automática ni reenvío. Requiere decisión administrativa basada en evidencia.
- `set_trusted_context` admite cambiar digest con la misma revisión: se detecta en claim, pero debe definirse monotonicidad estricta de revisión para evitar ambigüedades.
- Los permisos mínimos y la sintaxis PL/pgSQL no se han verificado en un motor desechable. No activar servicios reales.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
