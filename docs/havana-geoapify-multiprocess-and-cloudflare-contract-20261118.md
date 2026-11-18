# Verificación exacta, concurrencia multiproceso y contrato Cloudflare (2026-11-18)

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Base `7b63e7c411aa1f36611bc508f3c306ef96dddf`.

## Ejecución exacta del código publicado
Se recuperaron por GitHub los blobs de `durable-sqlite.mjs` y `durable-sqlite.test.mjs` del commit base y se copiaron íntegros al laboratorio local. Node.js v22.16.0: **PASS 16 SQLite offline assertions; 2/30 accepted**. La ejecución original de 30 promesas no era multiproceso.

## Fallo real reproducido y corrección
Al ejecutar 30 procesos Node independientes contra el mismo archivo SQLite, el proceso de inicialización falló con `ERR_SQLITE_ERROR: database is locked` (SQLite errcode 5). Se corrigió **solo** el defecto reproducido: `PRAGMA busy_timeout=5000` inmediatamente después de abrir la conexión. Repetición local:
- Prueba original: **PASS 16**.
- 30 procesos Node independientes: `{"accepted":2,"quota":28,"storage":0,"stats":{"used":0,"reserved":2},"pass":true}`.
- Commit correctivo: `64c2df068e68b33d1178330fb823288079723374`.
- La batería multiproceso quedó en `experiments/geoapify-offline/durable-sqlite.multiprocess.test.mjs`. La ejecución local usó una copia de contenido equivalente bajo otro nombre, **no una descarga independiente de ese blob**.
- La prueba de recuperación de la batería original reabre la base y verifica que se conservan créditos consumidos, rechazos por cuota y reinicio de día. El `nonce` único impide replay; reintentar no devuelve el resultado original (rechazo seguro, no idempotencia de respuesta). Falta contrato de idempotencia de operación con digest de payload.

## Contrato Worker / Durable Object específico (DISEÑO, no desplegado)
- Worker público: validar método POST, tamaño y esquema, origen como defensa secundaria, sesión de cliente verificable por backend, autorización, limitación por usuario y nonce/idempotency key. Nunca confiar en identificadores ni tarifas que suministre el cliente.
- Worker mantiene clave Geoapify exclusivamente en `env` secret y evita incluirla en logs, errores o frontend. No crear ni almacenar claves en este prototipo.
- Un Durable Object global por presupuesto de proveedor/día coordina cuotas de todas las instancias; reservar **antes** de invocar proveedor, registrar nonce, hash de payload, usuario, día y estado. Todos los caminos de consulta deben pasar por este mismo objeto. El plan de multi-almacén reserva el número de rutas necesarias; por defecto una.
- API correcta: `ctx.storage.sql.exec(query,...bindings)` para SQLite, `ctx.storage.transactionSync(callback)` o `transaction(callback)` para múltiples sentencias atómicas; **no usar** `BEGIN IMMEDIATE` con `sql.exec`. Consumir cursores sin atravesar `await`.
- Estados: `RESERVED` -> `CONSUMED` si respuesta conocida; `UNKNOWN_CONSUMED` ante timeout/fallo ambiguo. Al recuperar tras reinicio, **no liberar reservas inciertas automáticamente**: reconciliar conservadoramente para evitar sobrepasar cuota. Diseñar alarma para detectar reservas abandonadas, y un registro de créditos conservador.
- Idempotencia: misma clave + mismo hash de payload => devolver resultado almacenado sin nueva llamada; misma clave + payload diferente => conflicto; solicitudes concurrentes se unen a la misma operación. Retención de nonces/operaciones requiere política de expiración con garantías contra replay.
- Error de sesión, cuota, almacenamiento, Geoapify o falta de ruta => `PENDIENTE`, nunca distancia o tarifa inventada. Los secretos no deben figurar en URLs públicas ni trazas.
- Para evitar costos: comprobar plan gratuito de Workers, Durable Objects SQLite, condiciones comerciales, cuotas de lectura/escritura y uso diario; verificar disponibilidad y restricciones contractuales antes de crear cualquier servicio. No se puede demostrar costo cero operacional sin prueba y límites configurados.
- Cloudflare confirma que `sql.exec` no permite transacciones explícitas `BEGIN`; usar API de transacciones: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

## Pendientes de seguridad
No se han probado workers reales, autenticación real, red, llamadas Geoapify, sesiones revocadas, caídas entre reserva y consumo, procesos en máquinas distintas ni semántica de recuperación de Durable Objects. Los 30 procesos comparten **un mismo SQLite local**; no prueban coordinación distribuida. Las pruebas originales verifican rechazo de replay, no idempotencia con replay del resultado.

## Límites de operación
Solo documentación y prototipo aislado. No cuentas, claves, servicios, despliegues, GitHub Actions, costos, Supabase, staging, producción ni pedidos.
