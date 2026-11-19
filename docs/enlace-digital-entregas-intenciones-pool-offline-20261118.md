# ENLACE DIGITAL — Intenciones de un solo uso, pool compartido (offline)
Fecha: 2026-11-18. Base `ee49601ee5a30883a1ead3382a2a9230947a605f`, comparación inicial GitHub: identical.

## Publicación verificada
- `experiments/havana-delivery-quote/postgres-lab/shared_pool_intents.sql` — blob SHA `4e39f8d0f8942cbdbdefa050c263704c69d61550`.
- `experiments/havana-delivery-quote/postgres-lab/shared_pool_intents_static.test.js` — blob SHA `da7b75d0da05932d5d3f4e0dad72841d6cdb8f93`.
- `experiments/havana-delivery-quote/postgres-lab/shared_pool_intents_adversarial.md` — blob SHA `3e488c8c42202c92b6295fe45ec89614de5f3b33`.

## Diseño
Roles distintos `ed_intent_gateway` (inserción únicamente), `ed_intent_pool` (EXECUTE únicamente) y `ed_intent_owner` (propietario técnico NOLOGIN/NOBYPASSRLS). Intención con nonce_hash único, actor, operación, acción, audiencia, fingerprint de contexto, revisión, importe/objetivo, emisión, vencimiento y consumo. La función `consume` utiliza `FOR UPDATE`, rechaza nonce inválido, caducidad y replay y devuelve únicamente `LAB_CONSUMED_ONLY`, nunca autorización de entrega. No utiliza `session_user` como actor ni GUC manipulables.

## Pruebas
Archivo Node de 23 comprobaciones textuales preparado: `node experiments/havana-delivery-quote/postgres-lab/shared_pool_intents_static.test.js`. **No se afirma ejecución de Node ni de PostgreSQL en esta etapa.** La matriz contiene 13 escenarios adversariales propuestos, incluidas dos conexiones y reconexión. Sin motor PostgreSQL disponible no se han validado sintaxis, roles, transacciones, concurrencia, RLS, persistencia ni resultados.

## Limitaciones críticas
- La intención es segura solo si el gateway autentica al administrador y construye la fila desde datos verificados por servidor; un gateway comprometido puede insertar identidades falsas.
- El pool recibe un identificador y nonce hash como referencia; el nonce por sí solo no es prueba de identidad de usuario. La función solo consume, no autoriza.
- No se implementó integración transaccional con `approvals` ni revalidación atómica de cesta, destinatario, almacenes, reglas y rol actual. Se requieren controles contra intentos de consumir una intención válida pero destinada a otra acción.
- El esquema no configura logins ni credenciales reales. Un pool que herede rol de gateway/propietario rompe el aislamiento. El propietario técnico de funciones y sus privilegios requieren pruebas reales.
- No hay auditoría persistente de rechazo ni prueba de resiliencia ante commit desconocido.
- `15 minutos` en prototipos anteriores es parámetro experimental, no política aprobada.

**Estado operativo:** `PENDIENTE` para cualquier cotización mixta especial sin autorización backend comprobada. No modificar checkout ni activar pagos.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
