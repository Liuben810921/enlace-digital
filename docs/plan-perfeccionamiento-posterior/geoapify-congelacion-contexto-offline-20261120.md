# ENLACE DIGITAL — congelación durable del contexto (2026-11-20)

Base `a03e21d3f3bee99a1aed93ee31de775afc2476c5`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`; comparación inicial GitHub `identical`.

## Implementación offline
- `021_geoapify_context_freeze.sql`: tabla `context_freeze_audit` con una congelación durable por operación. `authorize_send_once` crea la congelación y pasa a SEND_AUTHORIZED en una sola transacción bajo advisory lock.
- `set_trusted_context` rechaza cualquier escritura, incluso idempotente, mientras la congelación no esté liberada. Antes de SEND_AUTHORIZED, un cambio válido de contexto cuarentena READY/CLAIMED.
- `finish_dispatch` conserva la congelación en UNKNOWN y la libera solo al registrar SUCCEEDED o FAILED_CHARGED, dentro de la misma transacción que la transición del ledger.
- `022_geoapify_context_freeze_tests.sql`: casos rollback de congelación, intentos de mutación, replay de envío, UNKNOWN sin descongelación, conciliación terminal y posterior actualización de contexto.
- `run_concurrency.py`: referencias verificadas a los nombres exactos 021 y 022; un primer cambio había escrito erróneamente `frozen_context` y fue corregido.

## Evidencia realmente ejecutada
Archivos exactos obtenidos de GitHub:
- 021 blob `d1ca7f228064a01cf4c1e192516dde9421ffe7fb`: 5/5 comprobaciones textuales.
- 022 blob `b34b642c1021e7960908c6f62d4942821f6ae49e`: 5/5 comprobaciones textuales.
- Runner final blob `61cf1cdbe1a9ff07b510419a801463d17d198d8a`: comprobadas referencias exactas a 021 y 022.

Se revisaron BEGIN/cierre, delimitadores $$, ausencia de transporte HTTP y presencia de condiciones de congelación. **No se ejecutó PostgreSQL, SQL, pruebas de concurrencia real ni Node.js**. Las pruebas adversariales están escritas pero no ejecutadas.

## Pruebas concurrentes y commit desconocido pendientes de motor
1. Sesión A ejecuta autorización final y COMMIT; sesión B intenta cambiar el contexto simultáneamente. Se espera que B espere el advisory lock y rechace el cambio después del COMMIT de A.
2. Si A revierte antes de COMMIT, no deben persistir SEND_AUTHORIZED ni congelación; no se debe permitir envío por una respuesta no confirmada.
3. Si el cliente pierde la confirmación del COMMIT, debe consultar el estado durable en una sesión nueva. Si aparece SEND_AUTHORIZED/UNKNOWN, **no** debe repetir la autorización ni reenviar; si no puede determinar el estado, cuarentena operativa.
4. Tras UNKNOWN, comprobar que los cambios siguen bloqueados hasta reconciliación terminal y que un segundo token no puede obtener autorización.

## Riesgos abiertos
- El contrato solo protege escrituras que utilicen `set_trusted_context` y respeten los permisos; un administrador con acceso directo a tablas puede eludirlo. Antes de activación se requieren privilegios mínimos, políticas de bloqueo y pruebas de roles.
- La congelación puede durar indefinidamente si nunca se obtiene evidencia confiable de resultado. Es deliberado: no se desbloquea por timeout.
- La conciliación SUCCEEDED/FAILED_CHARGED no demuestra por sí sola que la evidencia del proveedor sea auténtica: la capa de autorización del reconciliador aún no está implementada.
- La transacción SQL no es atómica con HTTP externo. Los advisory locks transaccionales se liberan al finalizar la transacción (PostgreSQL: https://www.postgresql.org/docs/current/explicit-locking.html).
- SQL 021/022 no se validó en motor PostgreSQL y no debe desplegarse.

Sin instalar PostgreSQL ni usar Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
