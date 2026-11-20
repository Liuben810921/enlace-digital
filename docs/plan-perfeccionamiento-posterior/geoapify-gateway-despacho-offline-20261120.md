# Geoapify — integración offline del despacho fail-closed (2026-11-20)

Base `756e878dd1d005db7d0a5c14138be636503946e1`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial `identical`, sin commits posteriores.

## Implementación
- `edge-function-offline/gateway.mjs` ahora exige tres adaptadores confiables: `authenticate`, `reserveAtomic` y `authorizeDispatch`. El punto de entrada Deno sigue sin adaptadores, de modo que continúa bloqueado.
- La reserva debe indicar `committed:true`, `lifecycle:'RESERVED'`, un identificador y razón `RESERVED` o `REPLAY_RESERVED`. Cualquier reserva `RELEASED`, `REVIEW_REQUIRED`, `DISPATCHED`, `CONSUMED` o `FAILED_CHARGED` se rechaza.
- `authorizeDispatch` debe certificar transaccionalmente el cambio de RESERVED a DISPATCHED y devolver identidad de operación y reserva coincidentes. La ausencia de autorización, un identificador distinto o un estado inesperado bloquea la solicitud.
- Incluso con adaptadores sintéticos que devuelvan autorización, la respuesta sigue siendo `PENDIENTE / PROVIDER_NOT_CONNECTED`: no hay fetch ni tarifa.
- `gateway.test.mjs` amplía 18 a 24 casos, incluyendo replay de reserva liberada, revisión, adaptador ausente, despacho denegado, identificador incorrecto y replay reservado.

## Evidencia y limitaciones
- Se consultaron en GitHub los archivos exactos y se verificó el commit inicial. Los archivos se guardaron en la rama aislada.
- **No se ejecutaron los 24 casos directamente desde el checkout GitHub** en esta sesión; no se afirma 24/24 PASS. Node.js 22.16.0 está disponible, pero los archivos de GitHub no se materializaron en el entorno de ejecución.
- No se ejecutó PostgreSQL, Deno ni concurrencia SQL. No se intentó instalar PostgreSQL.
- La transición de despacho debe ser realmente atómica en PostgreSQL y debe impedir dobles despachos entre instancias; el adaptador sintético no prueba esa garantía. `REPLAY_RESERVED` exige verificación de estado en la misma transacción.
- No confiar en un adaptador controlado por cliente; la identidad y autorización deben provenir de backend seguro. Queda pendiente contrato canónico de hash y protección contra cambio de contexto.
- **Estado operativo: PENDIENTE**. Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
