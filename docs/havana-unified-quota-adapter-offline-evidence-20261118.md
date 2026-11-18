# ENLACE DIGITAL — cuota unificada offline: ejecución y límites, 2026-11-18

Base: `e591cfd4f35d442c60ba64b7b5381ae036daac64`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Código recuperado y pruebas verificadas
Se recuperaron por GitHub los contenidos de `shared-quota.mjs`, `shared-quota.test.mjs`, `idempotency-norm-v2.mjs`, `idempotency-norm-v2.test.mjs`, `idempotency-norm-v2.adversarial.test.mjs`, `strict-json-v2.mjs` y `idempotency-ledger.mjs`. El comparador de GitHub confirmó rama idéntica a la base antes de escribir. Intento de descarga directa: `curl: (6) Could not resolve host: raw.githubusercontent.com`. Se reconstruyeron localmente los dos archivos de cuota compartida a partir de los textos devueltos por el conector y se ejecutó Node v22.16.0:
```
PASS 18 shared-quota assertions; 24 processes, 3 reserved, 21 quota
```
SHA-256 de las copias locales reconstruidas:
- `shared-quota.mjs`: `933807e9f15cf364226b96f3da226273be6160747dc0a1b26a51b20f7ae1b649`
- `shared-quota.test.mjs`: `2823b9c526aa5e94f7fb5834d811dbe8c154cbb29edb8855c9b4e3e7b8392313`

**No se ejecutaron en esta fase las dos baterías NORM-v2 publicadas**, aunque sí se recuperó su texto. Los hashes anteriores son de reconstrucciones locales, no verificación binaria independiente de blobs GitHub.

## Adaptador nuevo, exclusivamente aislado
Archivos: `unified-adapter.mjs`, `unified-adapter.test.mjs`, `unified-adapter.race.test.mjs`. Reserva cuota compartida y vincula identidad sintética+hash en **una única transacción SQLite**. El primer diseño local tenía una ventana entre reserva e inserción de identidad; se corrigió antes de publicar mediante transacción atómica. Reutiliza `SharedQuota` para finalizar, contabilizando conservadoramente los resultados inciertos. No modifica el Ledger legacy ni NORM-v2.

Pruebas locales:
```
PASS 10 unified adapter assertions
PASS 3 unified adapter race assertions; 24 processes, 3 reserved, 21 quota
```
SHA-256 de las copias locales:
- `unified-adapter.mjs`: `d0ad10ca205747c730118d66745759fb721f6ab817a57a035461c5715a3c06dd`
- `unified-adapter.test.mjs`: `080c120c1121a6a02f73a35ef2e47ee27687316405795a3aad828d017ae43a18`
- `unified-adapter.race.test.mjs`: `26ff23d9c443771a267bac07cff27574a6b835bfdc73364c7a509770c8d485a5`

**Limitación importante de ejecución:** las pruebas locales del adaptador utilizaron un módulo auxiliar mínimo `idempotency-norm-v2.mjs` para generar hashes, **no el módulo NORM-v2 exacto de GitHub**. Por tanto la equivalencia del adaptador completo con su código publicado no está certificada y la semántica de canonicalización real requiere repetición exacta. El código del adaptador y las pruebas se publicaron mediante el conector; no se descargaron para ejecución independiente.

## NO-GO operativo
- El adaptador es una vía alternativa, **no intercepta ni bloquea** las llamadas directas a los Ledger antiguos. Para imponer un único presupuesto hay que impedir otras rutas de consumo, por diseño y permisos; todavía no está garantizado.
- `finish` no exige identidad verificada; el llamador es sintético, no existe autenticación. Se debe reforzar antes de cualquier uso.
- La clave de idempotencia del adaptador se separa por versión; no evita que una misma operación lógica con dos identificadores/versiones diferentes reserve dos veces. Hace falta un identificador global y política de migración.
- `legacy` usa hash JSON.stringify; `NORM-v2` usa canonicalización; deben evaluarse las diferencias y conflictos en un plan de compatibilidad.
- La prueba multiproceso utiliza un SQLite local, no Cloudflare Durable Objects. Cloudflare requiere `ctx.storage.transactionSync` o `transaction` para agrupar operaciones: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- Se han usado exclusivamente datos sintéticos. Sin GitHub Actions, cuentas, servicios, claves, despliegues, Supabase, staging, producción, clientes ni pedidos.

## Siguiente paso
Recuperar y ejecutar copias exactas de los tres archivos nuevos y ambas baterías NORM-v2; implementar autorización sintética de `finish`, identidad global entre versiones, y pruebas de fallos entre commit y respuesta. Mantener todo aislado.
