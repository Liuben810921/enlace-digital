# NORM-v2: canonicalización, identidad sintética y compatibilidad aislada (2026-11-18)

Base: `0c87f7b3a98d4010cf21cfb8379cffd251a1afd3`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Ejecución local real
- Node.js v22.16.0, SQLite experimental.
- Se ejecutó `node /mnt/data/ed-normv2/ledger-v2.test.mjs` => **PASS 31 NORM-v2 assertions**, exit code 0.
- Se probaron hash estable ante orden de claves, normalización Unicode NFC en claves y valores, colisiones Unicode, claves duplicadas en JSON antes de parsear, identidad sintética vinculada al hash, conflictos entre identidades, reuso de resultado, cierre/reapertura de SQLite y resultado incierto que consume cuota.
- La implementación publicada en GitHub está dividida en `idempotency-norm-v2.mjs`, `strict-json-v2.mjs` e `idempotency-norm-v2.test.mjs`. **No es byte a byte la implementación local ejecutada**, y la prueba publicada tiene un número distinto de aserciones. Es obligatorio ejecutar los tres blobs exactos publicados antes de afirmar que la versión GitHub pasa. La cifra de 31 corresponde exclusivamente al laboratorio local.

## Compatibilidad y límites
- NORM-v2 utiliza tablas `quota_v2` y `ops_v2` y prefijo de hash `NORM-v2:`; no migra ni modifica `Ledger` original. No se ha probado una base preexistente con ambas versiones en uso simultáneo.
- Identidad sintética no es autenticación real; el servidor debe obtenerla de una sesión verificada, no de un parámetro cliente.
- JSON con claves duplicadas se rechaza antes de `JSON.parse`; parser artesanal aún necesita fuzzing, revisión de Unicode, profundidad, límites de tamaño, arrays y escapes antes de producción.
- No se ha simulado caída física de proceso ni almacenamiento corrupto; solo cierre/reapertura.
- No hay Cloudflare Worker real ni Durable Object real; código Node `DatabaseSync` no es desplegable como DO.
- No hay claves reales, cuentas, servicios, despliegues, GitHub Actions, Supabase, staging, producción, pedidos ni costos.

## Siguiente verificación
Recuperar desde GitHub los tres archivos publicados y ejecutar exactamente `node experiments/geoapify-offline/idempotency-norm-v2.test.mjs`. Después probar múltiples procesos y fuzzing del parser. No integrar con el sitio operativo sin autorización.
