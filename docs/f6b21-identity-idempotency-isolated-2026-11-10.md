# F6-B21 — Vinculación sintética de identidad e idempotencia por operación

Fecha: 2026-11-10. Base autorizada: `2d3ed4a17c01aec807c48ea996fb5aedd29de31e`. CI previo #71 y #620: SUCCESS. Alcance exclusivo GitHub y PostgreSQL 17 desechable.

## Diseño y garantías limitadas
- Identidad de prueba: dos roles LOGIN separados, `f6b21_a` y `f6b21_b`; la función SECURITY DEFINER obtiene `session_user` de la conexión autenticada. No acepta client_id desde el payload. `SET ROLE` no permite suplantar `session_user`.
- El alcance de unicidad es `(identity_name, operation_key)`, independiente de la unicidad NORM-v1 por dirección.
- La entrada es JSONB de esquema restringido (action, amount). PostgreSQL normaliza el orden de las claves y espacios JSON; el servidor calcula SHA-256 sobre bytes UTF-8 de `F6B21-v1|` + `payload::text`. El caller no suministra el digest.
- `INSERT ON CONFLICT DO NOTHING` y lectura posterior serializan conflictos de claves en transacciones concurrentes.
- RLS habilitado y FORCE ROW LEVEL SECURITY; owner NOLOGIN, NOBYPASSRLS; solo EXECUTE a roles autorizados, sin grants directos de tabla.

## Matriz sintética
1. Misma identidad, clave y payload con orden/espacios diferentes: REPLAY.
2. Misma identidad y clave con payload distinto: CONFLICT.
3. Misma clave y payload bajo otra identidad: NEW independiente.
4. Acceso directo SELECT/DELETE, invocación por extraño y SET ROLE a otra identidad: denegados.
5. Campo client_id adicional: payload rechazado.
6. ROLLBACK: no reserva clave.
7. Dos sesiones concurrentes con mismo payload: NEW + REPLAY.
8. Dos sesiones concurrentes con payload distinto: NEW + CONFLICT.
9. Una clave antigua permanece reservada: sin TTL, cron ni limpieza.

## Límites de seguridad
La identidad está vinculada exclusivamente al login de PostgreSQL **sintético**. No se ha probado JWT, Supabase Auth, gateways, proxies con cuentas compartidas, ni autenticación de usuarios reales. La serialización `jsonb::text` **no es un estándar de canonicalización entre plataformas**; valores numéricos equivalentes con distinta representación pueden diferir. No se prueban normalización Unicode, precisión monetaria, reintentos de efectos externos, retención, protección de respuestas frente a oráculos ni recuperación de pedidos. El prototipo es NO-GO para staging/producción sin diseño y autorización adicionales.

## Aislamiento, reversión y autorizaciones
No hay conexión a Supabase, datos históricos, pedidos, correo, secretos reales ni código operativo. La única base es el contenedor efímero de GitHub Actions. Credenciales LOGIN son exclusivamente fixtures de CI. Costos de GitHub Actions sujetos a cuotas. Reversión: revertir los commits de esta rama; no hay migraciones ni servicios desplegados.

**Autorización A (independiente):** necesaria antes de cualquier modificación de staging. **Autorización B (independiente):** necesaria antes de cualquier lectura de datos históricos, incluso agregados. Ninguna está concedida.

## Verificación CI
**PASS sintético verificado:** GitHub Actions #75, run `42908940873`, commit `ee953b0a64a489439820802c67e25f59da191cf5`, job `130154165925` concluido `success`. Los pasos F6-B21 de configuración y ejecución finalizaron `success`; las denegaciones SQL visibles en logs corresponden a pruebas negativas esperadas. No hubo pasos fallidos. El contenedor se eliminó al terminar. La validación no equivale a autorización de despliegue ni a pruebas con identidades reales.

## F6-B22 — extensión adversarial sintética (sin despliegue)
Se incorporan pruebas reproducibles al mismo ejecutor de PostgreSQL 17 desechable: (a) equivalencia de orden/espacios JSONB frente a diferencia representacional `1` vs `1.0`; (b) distinción Unicode NFC/NFD; (c) rechazo de claves cortas, null, arrays, campos adicionales, valores de tipo incorrecto y acciones vacías o excesivas; (d) ausencia de reserva tras petición inválida; (e) independencia entre identidades; (f) rechazo de UPDATE/TRUNCATE directos y de invocación por rol extraño.

**Límite de diseño:** `payload::text` de JSONB no proporciona canonicalización monetaria ni Unicode portable. Para una eventual implementación real deberán definirse un esquema versionado, unidades monetarias enteras, normalización Unicode explícita, una identidad validada por el backend y políticas de retención. El prototipo deliberadamente demuestra divergencias, no las corrige en producción.

**Estado CI F6-B22:** pendiente de ejecución y revisión del commit que incorpora esta extensión; no declarar PASS hasta consultar el job correspondiente. El CI #75 citado arriba valida F6-B21 anterior, no esta ampliación.
