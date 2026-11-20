# ENLACE DIGITAL — revisión de contexto y despacho bajo bloqueo SQL (2026-11-20)

Base `3cdb87f835167bafabc79556989182fba97cdc90`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. GitHub compare inicial: `identical`.

## Código
- `011_geoapify_trusted_context_lock.sql`: tabla `trusted_context` por (principal,operation_id) con revisión y digest; `set_trusted_context` aplica bloqueo advisory transaccional, rechaza retrocesos de revisión y actualiza contexto; `authorize_dispatch_contract` verifica bajo el mismo bloqueo revisión y digest actuales, reserva aún RESERVED y transición efectiva única.
- `012_geoapify_trusted_context_tests.sql`: pruebas adversariales rollback para revisión obsoleta, digest distinto, primer despacho y despacho repetido.
- `run_concurrency.py`: ejecuta 010 antes de aplicar 011, ya que 010 prueba el contrato previo sin registro de contexto; después aplica 011 y ejecuta 012.

## Evidencias
- Se consultaron en GitHub los archivos originales de 009, gateway.mjs y el ejecutor, y se confirmó la rama sin commits posteriores.
- Se guardaron migración, pruebas y orden de ejecución en GitHub.
- **No se ejecutaron SQL ni pruebas de concurrencia PostgreSQL**; no existe autorización para instalar el motor. No se afirma atomicidad probada.
- **No se ejecutó una nueva batería Node.js**: el cambio de este turno es SQL/Python, y no se dispone de una copia exacta local verificable del conjunto completo de pruebas Node.js. Las pruebas Node existentes permanecen sin cambios.

## Limitaciones y riesgo restante
1. El bloqueo compartido entre `set_trusted_context` y `authorize_dispatch_contract` evita intercalaciones **solo si todos los escritores del contexto utilizan la función protegida**. Escrituras directas a la tabla deben prohibirse por privilegios; `SECURITY INVOKER` y REVOKE PUBLIC no bastan por sí solos para demostrar separación de roles.
2. La tabla trusted_context es un prototipo: el digest se recibe como argumento y no se deriva automáticamente de los almacenes/destinos autorizados. Un backend confiable debe calcularlo a partir de datos canónicos.
3. La comprobación de revisión y transición se realiza dentro de una única transacción SQL, pero la entrega a proveedor posterior requiere un outbox/claim idempotente; no se afirma entrega exactamente una vez.
4. La prueba 012 no reproduce carreras reales entre sesiones. Requiere PostgreSQL desechable y pruebas de concurrencia antes de uso operativo.
5. El gateway permanece deshabilitado y responde PENDIENTE.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
