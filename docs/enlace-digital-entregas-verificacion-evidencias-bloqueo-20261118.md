# ENLACE DIGITAL — auditoría focalizada de evidencias del bloqueo, 2026-11-18

Rama: `plan/havana-osrm-benchmark-offline-20261114`.
Se verificó por lectura directa en GitHub que existe `docs/enlace-digital-entregas-bloqueo-real-offline-20261118.md`, blob `1ac28b14409a031f970abea5b846129fee06c32e`.

## Defecto demostrado y corrección
El runner aceptaba coincidencias parciales mediante `assert.match` para A, B y replay. Una salida SQL con texto adicional o contradictorio podía satisfacer el patrón. Ahora las respuestas A/B se comprueban por línea exacta, se rechazan valores contradictorios y replay exige la última línea exacta `PENDIENTE`. Se corrigió asimismo una doble barra invertida accidental en la expresión regular de separación de líneas durante la edición.

## Evidencias y límites
- Lectura del contenido GitHub del runner corregido; blob `a518649b0e2c018552b87411cbff4d5a9562954e`.
- Parseo de JavaScript en V8: **PASS** (solo sintaxis, no ejecución de runner).
- La consulta de bloqueo usa `pg_blocking_pids(b.pid)` y `wait_event_type='Lock'`; **no se ha ejecutado**.
- Persisten límites de sincronización por sondeo y cancelación cooperativa. La preparación no demuestra aislamiento efectivo de roles ni ejecución de SQL.
- **0 pruebas PostgreSQL, 0 ejecuciones psql, 0 ejecuciones reales del runner.**
- Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
