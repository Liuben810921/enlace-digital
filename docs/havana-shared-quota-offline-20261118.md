# Control compartido de créditos: pruebas offline y límites (2026-11-18)

Base: `4a99542f1c5d4880c2ee4cce87dd566a1ef3861a`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Recuperación de código GitHub
Se recuperaron mediante el conector GitHub los textos exactos de `idempotency-norm-v2.adversarial.test.mjs`, `idempotency-norm-v2.test.mjs` y `strict-json-v2.mjs` y se confirmó que la rama coincide con el commit base. El entorno de contenedor no puede resolver github.com por DNS, por lo que **no fue posible descargar y ejecutar directamente los blobs exactos desde GitHub**. No se debe afirmar que esas dos baterías quedaron reejecutadas en esta fase.

## Ejecución real local
Node.js `v22.16.0`, SQLite `node:sqlite` experimental. Archivos locales `/mnt/data/ed-shared/shared-quota.mjs` y `shared-quota.test.mjs`: `PASS 18 shared-quota assertions; 24 processes, 3 reserved, 21 quota` (exit 0). Se publicó el código y la prueba bajo `experiments/geoapify-offline/`; el texto fue transcrito al conector GitHub, **sin certificación de igualdad byte a byte** ni ejecución posterior del blob publicado.

## Casos probados
- Presupuesto sintético común a etiquetas `legacy` y `NORM-v2` en una misma tabla SQLite `shared_credits`.
- Reserva transaccional con `BEGIN IMMEDIATE`, `busy_timeout=5000`, clave `(version,op_id)`, cuota máxima 3.
- 24 procesos Node independientes: 3 reservados y 21 rechazados por cuota; ningún exceso.
- Recuperación tras cerrar/reabrir archivo SQLite; consumo conservador `UNKNOWN_CONSUMED`; repetición no vuelve a reservar; fallo cerrado con conexión cerrada.
- No se alteraron los prototipos antiguos ni sus tablas.

## Limitación crítica
Este coordinador es **una simulación independiente**; las clases legacy y NORM-v2 existentes **NO llaman al nuevo coordinador**. Por ello, aunque se prueba la contabilidad unificada en el laboratorio, no existe todavía garantía de presupuesto global si las versiones originales se usan simultáneamente. Integración exige adaptar todas las rutas de consumo para usar exclusivamente el mismo registro y validar compatibilidad, sin modificar producción.

Cloudflare Durable Objects usa `ctx.storage.transactionSync()` y `ctx.storage.sql.exec()`, no `BEGIN IMMEDIATE` directamente: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/ . El modelo Node no prueba Cloudflare.

## Restricciones
No se ejecutaron GitHub Actions ni se crearon cuentas, claves, servicios, despliegues o costos. Sin acceso a Supabase, staging, producción, clientes ni pedidos.

## Siguiente paso
Obtener copia local verificable de los blobs exactos GitHub y ejecutar las dos baterías pendientes; verificar SHA-256 del nuevo código y prueba publicados; diseñar un adaptador transaccional único para ambas versiones sin activar ninguna.
