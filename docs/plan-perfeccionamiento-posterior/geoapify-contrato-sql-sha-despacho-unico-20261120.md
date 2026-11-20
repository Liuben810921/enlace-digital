# Geoapify — contrato SQL SHA-256 y despacho único (2026-11-20)

Base `f520aaa15e7e990a2cd4ed16d41a637b14321a9a`, rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: `identical`.

## Cambios
- `009_geoapify_gateway_contract.sql`: funciones `reserve_contract` y `authorize_dispatch_contract`. El campo SQL `payload_hash` se usa como digest SHA-256 del contexto; el wrapper reserva devuelve `context_digest`, `lifecycle`, `reason`, `reservation_id` y `committed`. El wrapper de despacho exige identificador, digest y estado `RESERVED`; devuelve `reason='APPLIED'` solo tras transición efectiva. Replays de despacho no obtienen nueva autorización.
- `010_geoapify_gateway_contract_tests.sql`: pruebas SQL con rollback para reserva vinculada, primer despacho, doble despacho, replay posterior y digest incorrecto.
- `run_concurrency.py`: migración 009 y prueba 010 añadidas al orden del ejecutor.

## Verificación realmente ejecutada
- Se consultaron directamente los archivos fuente en GitHub y se verificó que la rama estaba en el commit base.
- Node.js `v22.16.0`: cinco aserciones focalizadas **5/5 PASS** sobre una **reconstrucción local** de `dispatch-contract.mjs`, con hash local `2d2e452432407782ab9aa6abfc1841fba4225c0d`. Este hash **no coincide** con el blob GitHub `79f07d408efc53eca91838dde10d23b5e762c283`, pues no se incluyó el comentario inicial. No afirmar copia exacta.
- Las aserciones cubren reserva aceptada, despacho aceptado, replay de despacho denegado, reserva liberada denegada y cambio de revisión detectado.
- No se ejecutaron SQL, pruebas de carreras entre procesos ni el ejecutor completo. No se intentó instalar PostgreSQL.

## Bloqueantes
- El wrapper SQL acepta `p_context_revision` sin persistirla independientemente: solo vincula la revisión al digest si el adaptador calcula y verifica la huella desde el contexto canónico del servidor. Antes de integrar, garantizar esa correspondencia en el backend.
- `reserve_contract` y `authorize_dispatch_contract` requieren un adaptador confiable con privilegios mínimos, no acceso directo del cliente. El SQL es un prototipo desechable no verificado en motor real.
- Un bloqueo advisory global serializa transiciones en el prototipo, pero su corrección y comportamiento entre instancias siguen pendientes de pruebas reales.
- Una transición SQL exitosa a DISPATCHED no equivale a una llamada al proveedor: antes de activar se necesita protocolo de envío idempotente y recuperación de fallos para evitar pérdidas o duplicados.
- El gateway sigue devolviendo PENDIENTE y no contacta Geoapify.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
