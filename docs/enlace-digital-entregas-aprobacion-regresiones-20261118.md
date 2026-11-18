# ENLACE DIGITAL — Aprobación manual offline: publicación exacta y regresiones

Fecha 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`. Base `0329bea7e03370c6128505cb990afd676f497dfb`, comparación inicial GitHub: identical.

## Archivos recuperados y publicados
Los archivos originales `server-approval.js` y `server-approval.test.js` se recuperaron de `/mnt/data/ed_manual`. Los SHA Git originales publicados **antes de la corrección** coincidieron con los hashes históricos documentados: `51f5a8539077987ffda462a26ccfc8385e292e62` y `e1405233760796ea2a132432ec65801bbc95374f`. Batería histórica: `PASS 21 server-side offline lab assertions`.

## Defecto comprobado y corregido
La versión original permitía que un reintento idéntico devolviera `APPROVAL_STORED` tras revocar el registro, aunque `resolve` devolvía `APPROVAL_REVOKED`. La nueva versión rechaza explícitamente reintentos de aprobaciones revocadas o caducadas, manteniendo la idempotencia de aprobaciones vigentes.

Archivos finales (hash local `git hash-object` = GitHub `fetch_file`):
- `server-approval.js`: `fcf997ecd3398b4c553232da213f2dad98e3e446`
- `server-approval.test.js`: `2e03884382fe35cdefb62974e49988b7ec0d3319`
- `server-approval.races.test.js`: `dee3fdf0b034e6666b7eae0c9a3799a6990f3c8c`

## Comandos y resultados locales
```sh
cd experiments/havana-delivery-quote
node server-approval.test.js
# PASS 21 server-side offline lab assertions
node server-approval.races.test.js
# PASS 12 sequential interleaving and idempotency assertions (not true parallelism)
```
Node.js 22.16.0, ambos exit 0. La batería adicional comprueba 100 reintentos secuenciales, conflicto de payload, revocación repetida, reintento posterior a revocación, caducidad, modificación de cesta y reutilización de operación con contexto distinto.

## Límites
**No son carreras paralelas reales**: JavaScript síncrono sobre un único `Map` en memoria serializa todas las operaciones. Tampoco hay persistencia después de reinicio, transacciones, bloqueo de filas, autenticación de servidor ni RLS. La idempotencia no sobrevive al reinicio del proceso y un segundo proceso tendría otro mapa. El simulador solo devuelve `APPROVAL_LAB_ONLY`; jamás es aprobación de cobro real. Un fallo de contexto o verificación debe mantener `PENDIENTE`.

Próximo bloqueo real: implementar y comprobar transacciones e idempotencia en almacenamiento compartido, autenticación/roles y revalidación en servidor, previa autorización independiente de staging. La cartografía vial y la conexión final a checkout siguen pendientes.

No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos, descargas cartográficas, despliegues ni costos.
