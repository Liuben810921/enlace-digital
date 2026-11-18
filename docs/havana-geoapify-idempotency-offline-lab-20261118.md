# Geoapify offline — idempotencia por operación y recuperación (2026-11-18)

Base `fc5bc21cb0f4b0cd5528d10ee630632d3c3e6707`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Archivos nuevos `experiments/geoapify-offline/idempotency-ledger.mjs` y `idempotency-ledger.test.mjs`.

## Ejecución local real
Node.js `v22.16.0` (`node:sqlite` experimental). Prototipo local `/mnt/data/ed-idempotency/idempotency.mjs` y pruebas `idempotency.test.mjs`: **`PASS 20 idempotency assertions; 20 processes: 1 reserved, 19 joined/pending`**, exit code 0. La prueba local contiene 20 aserciones: replay del resultado tras finalizar, conflicto por payload diferente, reserva única con 20 procesos Node independientes, recuperación después de reabrir SQLite, consumo conservador ante resultado desconocido y fallo cerrado tras cerrar almacenamiento.

## Límite de exactitud
Los archivos publicados en GitHub son una transcripción funcional de los archivos ejecutados localmente, con nombres distintos; **no se ha ejecutado aún un checkout exacto de los blobs publicados**. No afirmar equivalencia binaria ni que los 20 casos del archivo GitHub están certificados hasta descargarlos y ejecutarlos.

## Semántica
- Clave global de operación `id` y SHA-256 de `JSON.stringify(payload)`. Mismo identificador + hash y resultado `DONE` => `REUSED` sin reservar créditos; hash diferente => `CONFLICT`; reserva/resultado incierto => `PENDIENTE`.
- `BEGIN IMMEDIATE` + `PRAGMA busy_timeout=5000` en Node SQLite garantiza la atomicidad local de una reserva; no es código ejecutable en Cloudflare Durable Objects.
- Estado `UNKNOWN_CONSUMED` contabiliza conservadoramente la cuota ante incertidumbre; no inventa ruta.
- **Riesgos pendientes:** JSON.stringify no es canonicalización segura de payload frente a orden de claves, números especiales y claves duplicadas; la identidad no está vinculada a sesión verificada; falta validación estricta de campos y políticas de retención; no se debe almacenar resultados de un proveedor sin validar origen/esquema. El límite por día debe coordinarse globalmente. La política de reinicio ante `RESERVED` abandonado requiere reconciliación.
- Fallo cerrado de almacenamiento: respuesta `PENDIENTE` sin crédito ni tarifa inventados. Fallo antes/después de commit y fallos físicos de disco no simulados.
- Cloudflare DO SQLite requiere `ctx.storage.transactionSync(()=>{...sql.exec(...)})`, no `BEGIN IMMEDIATE`; documentación oficial: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

## Límites respetados
Sin claves, cuentas, servicios, llamadas de rutas, despliegues, GitHub Actions, Supabase, staging, producción ni pedidos. Solo prototipo aislado y documentos.
