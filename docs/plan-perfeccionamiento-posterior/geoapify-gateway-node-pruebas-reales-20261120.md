# Geoapify — Node.js verificable y contrato de despacho, 2026-11-20

Base `3e2f46797988830f397c8515c3096543dcc02cf1`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`, comparación inicial `identical`.

## Pruebas ejecutadas de archivos idénticos a GitHub
Se recuperaron `gateway.mjs` y `gateway.test.mjs` mediante el conector GitHub. Se materializaron copias locales y se comprobó `git hash-object` contra los SHA de GitHub:
- Antes del cambio: gateway `cee20cbdf43d2ad127d4ec156fdf9d7b570d7711`, pruebas `e289d27fbc7183969d0a86a48ee53ebf0001989c`. **24/24 PASS** en Node.js v22.16.0.
- Tras el cambio: gateway `8725d20e5b3e4ed565def8d6e62b2e1740a2a19a`, pruebas `35edf7aeecf831896066848a976228e3f9b417e6`, coincidencia exacta con blobs actualizados. **24/24 PASS** en Node.js v22.16.0.
- `dispatch-contract.test.mjs`: **12/12 PASS** en Node.js v22.16.0; hash de copia local `a3fe1870d34fac32ee07de8890f56398ba45358f`. Pruebas de digest, cambio de principal/revisión/destino, reserva liberada, recibo incompatible y rechazo de despacho repetido.

## Endurecimiento
- `dispatch-contract.mjs` calcula SHA-256 determinista de identidad, operación, revisión, modo, destino y orígenes ordenados por ID.
- `gateway.mjs` pasa el digest a `reserveAtomic` y `authorizeDispatch`. Exige que ambos recibos estén ligados al mismo digest.
- El recibo de despacho debe tener `reason:'APPLIED'`; un `REPLAY` de despacho no se acepta como nueva autorización. Reserva liberada o en revisión sigue denegada.
- Aun con recibos sintéticos correctos, respuesta `PENDIENTE/PROVIDER_NOT_CONNECTED`; no existe transporte externo.

## Bloqueantes
1. El prototipo SQL de PostgreSQL almacena `payload_hash`, pero todavía **no está cableado** al nuevo `contextDigest`; un adaptador confiable debe vincularlos y comprobarlos en la misma transacción.
2. `authorizeDispatch` es un contrato de interfaz, no prueba de bloqueo real entre instancias. Se requieren pruebas de concurrencia PostgreSQL antes de conectar un proveedor.
3. El hash incluye contexto suministrado por cliente: el servidor debe comprobar almacenes, destino y revisión contra datos confiables antes de autorizar despacho.
4. El adaptador de prueba permite construir recibos sintéticos. Nunca se debe exponer como API de cliente.
5. No se ejecutó PostgreSQL ni Deno; no se instaló software.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
