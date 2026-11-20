# ENLACE DIGITAL — congelación persistente de contexto (2026-11-20)

Base `a03e21d3f3bee99a1aed93ee31de775afc2476c5`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: identical, sin commits posteriores.

## Contrato offline
- `021_geoapify_frozen_context.sql`: redefine `set_trusted_context`. Bajo `pg_advisory_xact_lock(7342291,1)` lee `dispatch_outbox` con `FOR UPDATE` antes de bloquear `trusted_context`, consistente con el orden del gate final. Si outbox está SEND_AUTHORIZED o UNKNOWN, rechaza incluso el incremento de revisión; el bloqueo es **estado persistente**, no un lock mantenido durante HTTP.
- Conserva la monotonicidad: igual revisión + digest distinto se rechaza; revisión menor se rechaza. Cambio antes del gate pone READY/CLAIMED en QUARANTINED.
- Después de reconciliar SUCCEEDED/FAILED_CHARGED, el contexto puede evolucionar mediante revisión nueva, pero el outbox terminal no vuelve a ser reclamable ni autorizable.
- `022_geoapify_frozen_context_tests.sql`: aserciones rollback para gate final único, congelación SEND_AUTHORIZED, congelación UNKNOWN, claim bloqueado, conciliación terminal y no reenvío.
- `run_concurrency.py`: incluye 021 y 022 tras 020.

## Evidencias verificadas
Lectura exacta desde GitHub: 021 blob `7d2c1e9c2246aa883cc7176240a81305fdc94b9c`; 022 blob `77e52c69d874b7741a123d53d73f1ddc1edadd94`; runner blob `52ff377aa04b196e1241ac43f12a749f068327a5`.
**13/13 comprobaciones estructurales** pasaron: cinco en cada SQL (BEGIN único, cierre único, delimitadores, ausencia de HTTP, regla esperada), tres en runner (inclusión y orden).

## Pendientes críticos
- **No se ejecutaron SQL, PostgreSQL, concurrencia real ni Node.js**. No se instaló PostgreSQL. Las pruebas de sesiones concurrentes y commit desconocido son escenarios preparados, no resultados observados.
- Una autorización final comprometida podría haberse enviado o no. Tras pérdida del ACK, se debe consultar el estado durable y **no reenviar** aunque sea SEND_AUTHORIZED; puede requerirse marcar UNKNOWN para revisión.
- La congelación solo cubre mutaciones que pasan por `set_trusted_context`. Cambios directos en tablas fuente o rutas alternativas no quedan bloqueados: exigir privilegios mínimos, escrituras mediante contratos y pruebas de roles.
- No hay atomicidad entre commit SQL y HTTP externo. El modelo conserva la seguridad de no reenvío a costa de disponibilidad; no garantiza exactamente una entrega.
- Se necesita probar en PostgreSQL desechable la semántica PL/pgSQL, deadlocks y rollback, además de congelación ante dos sesiones.
- **Riesgo de recuperación**: no se creó un mecanismo administrativo de cancelación del outbox; el cierre UNKNOWN requiere evidencia confiable del resultado. No se consultó proveedor.

Referencia de semántica de bloqueos: https://www.postgresql.org/docs/current/explicit-locking.html (advisory locks transaccionales liberados al terminar la transacción).

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
