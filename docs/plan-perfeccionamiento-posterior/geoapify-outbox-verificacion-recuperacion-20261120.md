# ENLACE DIGITAL — verificación offline de migración 015 y recuperación (2026-11-20)

Base `0f19d596db84c2b3be10faae70c982c00e1e2346`; rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación GitHub inicial: identical, sin commits posteriores.

## Inspección del archivo exacto
Se obtuvo directamente desde GitHub `015_geoapify_outbox_clean.sql`, blob Git `87f01efaf747fc0c4b730e053aaf0161affea1cf`. Se ejecutaron **6/6 comprobaciones estructurales** sobre su contenido: BEGIN/COMMIT únicos, tres declaraciones de funciones, seis delimitadores $$, dos validaciones de token de longitud 12–73, COMMIT final y ausencia de transporte HTTP. Todas pasaron. Estas verificaciones **no** son análisis sintáctico PostgreSQL.

Se revisaron `014_geoapify_dispatch_outbox_tests.sql` y `run_concurrency.py` directamente en GitHub. El ejecutor referencia 015 y no 013.

## Pruebas adversariales nuevas
`016_geoapify_outbox_recovery_tests.sql`, blob Git `7fa39df523f89c7f3bca5577cc00846bab48473a`, contiene aserciones rollback para:
- Respuesta de autorización perdida: consulta de outbox persistente y rechazo de autorización repetida.
- Confirmación de claim perdida: mismo token y token distinto rechazados; sin segunda reclamación.
- Resultado desconocido: UNKNOWN no se reenvía ni se transfiere a otro worker.
- Conciliación simulada como FAILED_CHARGED, sin red ni proveedor.
- Resultado terminal contradictorio rechazado y un solo evento de contabilización.

**7/7 comprobaciones estructurales** del nuevo SQL pasaron (bloque BEGIN/ROLLBACK, delimitadores DO, presencia de los cinco grupos de aserciones). El runner se actualizó para incluir 016.

## Limitaciones y defectos de contrato pendientes
- **No se ejecutó PostgreSQL ni SQL**, ni se instalaron herramientas. Las aserciones SQL siguen pendientes de motor real y de pruebas de concurrencia entre sesiones.
- **No se ejecutaron pruebas Node.js**; no hubo cambios en módulos Node en este turno.
- Una operación CLAIMED puede haberse enviado o no. No es posible distinguirlo solo con el ledger; no se permite reintento automático. La recuperación depende de evidencia externa.
- **Riesgo funcional identificado**: la migración 015 valida el contexto al autorizar, pero `claim_dispatch` no vuelve a cotejar la revisión/digest confiables. Si el contexto cambia entre autorización y reclamación, un worker podría reclamar un despacho obsoleto. Debe bloquearse o cancelarse conservadoramente en una futura revisión SQL antes de integrar un transporte.
- Se necesita restringir permisos directos de escritura a tablas y verificar SQL en motor desechable antes de declarar atomicidad real.
- La transición SQL y una llamada externa nunca forman una única transacción distribuida: no se afirma entrega exactamente una vez.

No se usaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
