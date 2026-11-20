# Geoapify — bloqueo de replay y despacho, 2026-11-20

Base `aea3258dcedca56eb97550a7b1991aef8777c3e4`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: `identical`.

## Cambios verificables en código
- `postgres-disposable/007_geoapify_replay_dispatch_guard.sql` reemplaza `reserve`: únicamente `RESERVED` devuelve `committed=true` al repetir operación (`REPLAY_RESERVED`). `RELEASED`, `DISPATCHED`, `REVIEW_REQUIRED`, `CONSUMED` y `FAILED_CHARGED` devuelven `committed=false` y `RESERVATION_<estado>`; el identificador original se conserva para conciliación.
- `transition` impide despacho si la reserva tiene más de 5 minutos. Una reserva liberada o en revisión nunca vuelve a `DISPATCHED`. El evento sigue siendo idempotente mediante token único.
- `008_geoapify_guard_tests.sql` prepara pruebas con ROLLBACK para replay tras liberación, ausencia de doble débito, rechazo de despacho expirado, cuarentena de huérfanas, ausencia de devolución insegura y estado terminal.
- `002_geoapify_ledger_tests.sql`, `004_geoapify_quota_tests.sql` y `run_concurrency.py` se actualizaron al nuevo motivo `REPLAY_RESERVED` y al orden de migraciones 001 → 003 → 005 → 007.

## Estado de pruebas
La revisión de GitHub confirmó que no había commits posteriores al punto de partida. Se revisaron las rutas y expectativas de los archivos modificados. **No se ejecutaron las pruebas SQL ni la concurrencia PostgreSQL real**: el motor no está disponible y, conforme a la instrucción, no se repitieron intentos de instalación. La validez transaccional real permanece pendiente.

## Riesgos que siguen abiertos
1. La respuesta `committed=true` para `REPLAY_RESERVED` no equivale a autorización definitiva de despacho: el consumidor debe efectuar la transición `DISPATCHED` bajo control transaccional antes de contactar al proveedor.
2. La edad de 5 minutos es un umbral de prototipo, no una política operativa aprobada. La función `mark_orphans` marca para revisión sin liberar créditos.
3. La transición a `CONSUMED` o `FAILED_CHARGED` desde revisión requiere un evento backend confiable; no hay prueba externa de consumo.
4. No hay verificación de rol técnico, RLS, consumo real del proveedor, cuotas por segundo ni protección integral frente a commit desconocido.
5. Se requiere PostgreSQL desechable real para ejecutar `run_concurrency.py` y demostrar atomicidad. Hasta entonces no se conecta Geoapify.

**Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.**
