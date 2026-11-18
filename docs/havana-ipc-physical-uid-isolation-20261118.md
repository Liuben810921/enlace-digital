# ENLACE DIGITAL — Separación física experimental de broker y cliente IPC (2026-11-18)

## Alcance autorizado
Base `3ca8bd4e8315ea3b8e2eaedc7cc8a207a210bc3c`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`. No se modificaron los módulos históricos; se añadieron tres archivos de experimento.

## Diseño
- Proceso propietario UID 65533 / GID 65534: inicia el broker con `ipc-cross-launch.sh` y `ipc-cross-owner.worker.mjs`, conserva SQLite bajo directorio `0700` y publica socket `0660` bajo directorio `0750`.
- Cliente UID 65534 / GID 65534: `ipc-unprivileged-client.mjs` implementa únicamente descubrimiento del manifiesto y solicitudes por `node:net`; **no importa `node:sqlite` ni `ipc-broker.mjs`**. Su proceso no tiene acceso directo al directorio privado de SQLite.
- UID externo 65532 / GID 65532: prueba de conexión rechazada por permisos Unix.
- `ipc-unprivileged-probe.mjs`: ejecuta intentos sintéticos de abrir SQLite e importar directamente el módulo propietario. El import del módulo puede ser posible, pero **iniciar el broker con UID cliente falla** por permisos de directorio; esto no equivale a impedir todas las importaciones.
- `ipc-physical-isolation.test.mjs`: harness Linux local que crea directorios y procesos con UID numéricos de prueba, sin crear cuentas. Comprueba reserva, cuota compartida, segundo lanzador, manifiesto simbólico, SIGKILL, replay y doce procesos concurrentes.

## Ejecución real y procedencia exacta
Entorno Linux, Node.js v22.16.0, ejecución local. Salida:
```text
PASS 14 physical UID isolation assertions; 12 concurrent clients
```
Exit code 0. Los tres archivos nuevos fueron publicados y recuperados desde GitHub, y los SHA Git de las copias locales ejecutadas coincidieron:
- `ipc-unprivileged-client.mjs`: `da0333384ea6b091f02272ed091e22001c792de1`.
- `ipc-unprivileged-probe.mjs`: `bf0f9fef04898a837ce98043b97f6e7ba2f25f93`.
- `ipc-physical-isolation.test.mjs`: `72e1df0b93b29e4d1dc4395f8de039df6dba9304`.
- `ipc-broker.mjs` sin cambios: `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a`.
- `ipc-cross-owner.worker.mjs` sin cambios: `9cff90075e7cda369d82d35ea995728bc9ac9844`.
- `ipc-cross-launch.sh` sin cambios: `e7d28f45ab9343bdf1c294341e114645d2420ee5`.

**Precisión sobre versión:** este harness se ejecutó con `ipc-cross-rotation.mjs` blob histórico `e0b4d3e25ad8f72e14ca86c255912b0bd8b1b78e`, que conserva la misma interfaz de socket pero no incluye el bloqueo SQLite interno posterior. El lanzador `flock` del harness sí impide segundo lanzador autorizado. **No se ejecutó este harness nuevo contra el blob actual `88b5f6d04241dc813703d8962d91e20a69aa9e88`**; sus pruebas de exclusión interna corresponden a baterías previas. No se atribuye esta prueba a la versión más reciente del módulo.

## Riesgos residuales
1. Separación **por procesos y permisos Unix**, no aislamiento por contenedores, namespaces o sandbox del cargador Node.js. El cliente puede leer/importar código fuente si los permisos lo permiten, aunque no pueda abrir SQLite.
2. Un proceso con el UID propietario o root puede saltarse la frontera. `startBroker` sigue exportado y el harness no impide invocarlo por otra ruta.
3. La credencial `synthetic` es solo material de prueba, no autenticación robusta del par. No se implementó ni verificó `SO_PEERCRED`.
4. `lstatSync` seguido de `readFileSync` conserva riesgo TOCTOU en el manifiesto; no se demostró eliminación de carreras.
5. Los UID 65533/65534/65532, permisos y `flock` se probaron únicamente en Linux local. No se afirma equivalencia con infraestructura real.
6. No se creó ningún servicio real, ni se modificaron Supabase, staging, producción, clientes o pedidos. No se ejecutaron GitHub Actions.

## Próximo paso
Reejecutar el harness físico contra la versión actual exacta de `ipc-cross-rotation.mjs`, consolidar la distribución del cliente sin código propietario y evaluar un mecanismo real de autenticación de pares sin introducir secretos ni servicios externos.
