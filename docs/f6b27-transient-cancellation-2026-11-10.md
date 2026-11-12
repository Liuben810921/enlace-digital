# F6-B27 — fallos transitorios, cancelación, reintentos y ACL/RLS

Fecha: 2026-11-10. PR #3, rama aislada, PostgreSQL 17 efímero en GitHub Actions.

## Pruebas
1. Error SQL dentro de BEGIN tras reservar clave: la transacción se revierte y un nuevo intento devuelve NEW; el siguiente REPLAY.
2. Contención: una transacción sintética inserta una clave sin confirmar y mantiene la sesión abierta. Otra sesión usa `statement_timeout=250ms` y debe fallar por timeout sin consumir ni modificar la clave.
3. Cancelación: se cancela la consulta del titular de la transacción mediante `pg_cancel_backend` en PostgreSQL efímero, se comprueba recuperación y luego NEW/REPLAY/CONFLICT.
4. Canonicalización: permutaciones de claves JSON y espacios producen representación contractual idéntica.
5. Concurrencia: veinte intentos, diez por identidad sintética sobre la misma clave; exactamente un NEW y nueve REPLAY por identidad; payload diferente debe dar CONFLICT sin contaminación cruzada.
6. Permisos: FORCE RLS y ENABLE RLS confirmados; roles de laboratorio no pueden SELECT/DELETE/UPDATE/TRUNCATE sobre tabla ni SET ROLE owner; stranger no ejecuta función.

## Límites
Este ensayo no simula fallos de red HTTP, caídas de host, replicación, WAL, autenticación real, efectos externos exactamente una vez, TTL ni producción. `pg_cancel_backend` actúa solo sobre un proceso del PostgreSQL desechable. El timeout y las transacciones prueban atomicidad en el fixture, no comportamiento operativo.

No se toca Supabase, staging, producción, código operativo, clientes, datos históricos, servicios, correo ni pedidos. PR #3 sin fusionar ni desplegar. Se requieren autorizaciones independientes para staging o históricos.

CI F6-B27: pendiente de verificación definitiva.
