# Verificación exacta de idempotencia y endurecimiento offline — 2026-11-18

Rama: `plan/havana-osrm-benchmark-offline-20261114`; base: `38bdd6824af3b6fa4caedf3bb3beca4a0f488f85`.

## Evidencia ejecutada
1. Se recuperaron por conector GitHub los textos de `idempotency-ledger.mjs` y `idempotency-ledger.test.mjs` del commit base; se transcribieron íntegros al directorio local `/mnt/data/ed-idem-verify/`. Node v22.16.0: `PASS 20 idempotency assertions; 20 processes: 1 reserved, 19 joined/pending`, código de salida 0.
2. Se añadió el módulo **aislado** `hardening.mjs` y `hardening.test.mjs`. Prueba Node local: `PASS 24 canonicalization and crash-boundary assertions`, código de salida 0.
3. Hashes SHA-256 de los archivos base locales: `idempotency-ledger.mjs` `1044ba33a463e53a90f041b99b69ad075d01fe063850c41593cc7d8e8e83b221`; `idempotency-ledger.test.mjs` `434ac02acda09f406587c5cbed80cb1db4ff8a1e3066b48fe65a4414d73776d0`.
4. Se confirmó por fetch de GitHub que ambos archivos de hardening están publicados. No se verificó equivalencia de hashes de los blobs de GitHub con los archivos locales. La prueba ejecutada es del contenido local reproducido.

## Alcance del endurecimiento
- Serialización canónica ordena claves recursivamente, normaliza cadenas NFC, trata -0 como 0 y rechaza NaN, Infinity, undefined, funciones, prototipos no planos y claves peligrosas.
- `operationHash(identity,payload)` incluye una identidad **sintética aportada por el llamador**, no verifica autenticación; no conectar a sesiones reales sin backend autorizado.
- Pruebas de interrupción: cerrar y reabrir SQLite tras `RESERVED` conserva estado pendiente; marcar resultado incierto consume crédito de forma conservadora; cerrar y reabrir tras `DONE` devuelve `REUSED`.
- Las pruebas simulan reinicios mediante cierre/reapertura, **no** cortes físicos de energía, corrupción de disco o crash kill -9.

## Riesgos abiertos y límites
- **El módulo canonicalizador es nuevo y separado:** el Ledger anterior aún utiliza `JSON.stringify(payload)`; por tanto no afirmar que la canonicalización está integrada al flujo de reserva.
- JSON.parse ya descarta claves duplicadas del JSON de entrada; se requiere un parser con detección previa de duplicados si se exige rechazo estricto de claves repetidas.
- La normalización Unicode de claves y colisiones tras NFC necesitan manejo de duplicados normalizados.
- Identidad sintética no implica autorización; vincularla a un principal autenticado de confianza, y considerar revocación, expiración y control de acceso.
- Para integrarlo de forma segura: versionar esquema/hash (NORM-v2), decidir compatibilidad de operaciones existentes y ejecutar migración solo en base ficticia. Ninguna migración real autorizada.
- Cloudflare SQLite DO requiere `ctx.storage.transactionSync()`, no `BEGIN IMMEDIATE`: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

## Límites respetados
Solo rama aislada y pruebas offline. No GitHub Actions, cuentas, claves reales, servicios, despliegues, Supabase, staging, producción ni pedidos.
