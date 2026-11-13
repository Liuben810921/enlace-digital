# ENLACE DIGITAL — Versionado transaccional de cesta, dirección, almacenes y rutas

**Fecha:** 13 de noviembre de 2026. **Rama aislada:** `audit/delivery-map-readonly-20261113`. **CI final:** [GitHub Actions #43507242475](https://github.com/Liuben810921/enlace-digital/actions/runs/43507242475) — `completed/success`.

## Implementación verificada

- `tests/postgres-delivery-rpc-rls-lab.sql`: amplía `ed_rpc_lab.carts` con `destination_version`, `ed_rpc_lab.routes` con versiones de destino y almacenes, `ed_rpc_lab.quotes` con snapshots de ambas versiones, y agrega `ed_rpc_lab.warehouses` (versión global sintética) y `ed_rpc_lab.context_audit`.
- La RPC `quote_preview` compara la revisión de cesta, versión de dirección, versión de almacenes y revisión de ruta, además de tarifa. Rechaza snapshots obsoletos mediante SQLSTATE `40001`; una clave de idempotencia anterior no permite reproducir una cotización caducada.
- `mutate_context(kind,cart,expected,distance)`: RPC de laboratorio exclusiva del administrador general; cambia versiones de cesta, dirección, almacén o ruta con CAS y registra un evento de auditoría en la misma transacción. La renovación explícita de ruta actualiza las versiones asociadas al snapshot.
- Orden de bloqueos advisory transaccionales: tarifa (917321), almacenes (917322), cesta (917323, hashtext(cart_id)). La cotización obtiene bloqueos compartidos y la mutación exclusiva del contexto correspondiente. Así se evita confirmar una cotización con versiones obsoletas respecto a una mutación que se haya confirmado antes.
- El propietario de las RPC sigue siendo `ed_lab_rpc_owner`, `NOLOGIN`, `NOSUPERUSER`, `NOBYPASSRLS`. Las siete tablas de laboratorio tienen RLS habilitada y forzada. El propietario solo tiene los permisos de tabla necesarios para las RPC, y los gestores carecen de permisos de mutación directa.

## Pruebas

- `tests/postgres-delivery-rpc-rls-lab.py`: verificaciones previas de roles, propietario, RLS, aislamiento, idempotencia, concurrencia y auditoría; adaptadas al modelo de siete tablas.
- `tests/postgres-delivery-context-races-lab.py`: mutaciones sintéticas de cesta, destino, almacenes y ruta; invalidación de cotización previa; rechazo de nueva cotización sin ruta renovada; recuperación con ruta actualizada; denegación de cambios a gestores; auditoría accesible solo a administrador.
- Carrera A: mutación administrativa mantiene bloqueo exclusivo; cotización concurrente espera; tras confirmar el cambio, la cotización obsoleta se rechaza.
- Carrera B: cotización mantiene bloqueo compartido en una transacción abierta; cambio administrativo espera; tras confirmar la cotización, el cambio puede avanzar y la reproducción posterior de la cotización se rechaza como obsoleta.
- El script de carrera usa sesiones PostgreSQL reales, `pg_stat_activity.wait_event_type='Lock'`, coordinación de hilos y liberación de bloqueos en `finally` para evitar interbloqueos del propio test.
- La ejecución final `#43507242475` terminó satisfactoriamente con las suites Node, PostgreSQL de concurrencia/recuperación y el nuevo laboratorio SQL/RPC.

## Hallazgos y correcciones

La primera versión del test de carreras podía esperar indefinidamente al salir de un `ThreadPoolExecutor` antes de confirmar la transacción que mantenía el bloqueo. Se reestructuró el test para liberar los bloqueos en `finally` antes de esperar al hilo. La ejecución final pasó.

## Límites y bloqueantes de staging

1. El conjunto de almacenes se representa por **una versión global sintética**, no por un conjunto canónico de almacenes con procedencia verificable.
2. La dirección es **un contador de versión**; aún no hay normalización, asociación a destinatarios ni privacidad de direcciones reales.
3. El cálculo de distancia usa `server_fixture`; no hay proveedor de rutas ni evidencia de procedencia segura.
4. Las mutaciones de cesta y dirección del laboratorio las realiza una RPC administrativa sintética. En el sistema real deben existir permisos y límites de escritura para clientes/gestores, y todos los escritores deben seguir el protocolo de bloqueo/CAS. Una escritura fuera de las RPC puede romper la garantía.
5. `hashtext(cart_id)` es una clave de bloqueo sintética, no un identificador criptográfico. Las colisiones serializan más cestas de lo necesario, pero no conceden permisos.
6. El esquema mantiene `md5` como digest de idempotencia **solo para pruebas**, sin retención ni canonización de payload completo. No es apto para producción.
7. La identidad `session_user` es válida para las conexiones PostgreSQL ficticias individuales; **no es una propuesta directa para Supabase**, donde puede existir un rol compartido/pool. Se necesita autenticación real del servidor y diseño de RLS específico.
8. No se ha probado despliegue, migración, checkout, pedidos, pagos ni mensajería real.

**Dictamen:** pruebas transaccionales sintéticas aprobadas; **NO-GO para staging** hasta cerrar procedencia, identidad real, persistencia y autorización independiente. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
