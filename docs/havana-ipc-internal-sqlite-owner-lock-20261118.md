# ENLACE DIGITAL — exclusión interna de broker IPC (2026-11-18)

## Alcance
Base autorizada `d28facc9c1b4451ff0df23b0d211417aed8b133e`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`; comparación inicial GitHub: `identical`. Solo prototipo offline; sin GitHub Actions, cuentas nuevas, claves, servicios externos, despliegues, Supabase, staging, producción ni pedidos.

## Cambio implementado
`ipc-cross-rotation.mjs` adquiere **dentro de `startCrossRotation()`** una transacción SQLite `BEGIN IMMEDIATE` sobre una base **separada** `broker-owner-lock.sqlite` en el directorio privado de la base de cuotas. La transacción se mantiene abierta durante la vida del broker y se libera con `ROLLBACK` y cierre de conexión, o automáticamente al terminar el proceso por `SIGKILL`. Un segundo proceso que importe directamente `startCrossRotation()` no puede adquirir el mismo bloqueo; recibe `BROKER_ALREADY_RUNNING` y no publica un nuevo socket ni manifiesto.

El directorio SQLite debe ser propiedad del UID del broker y tener modo `0700`. Un archivo de bloqueo existente debe ser regular, del propietario correcto y privado. No se elimina ningún socket antiguo. La base de bloqueo es distinta de la de cuotas para evitar que la transacción permanente impida operaciones normales.

## Ejecución real y hashes exactos
Entorno local Node.js v22.16.0; contenedor de pruebas con UID 0 únicamente para lanzar procesos sintéticos UID 65533, 65534 y 65532; sin crear cuentas. Se recuperaron de GitHub los dos archivos publicados y sus SHA coincidieron con `git hash-object` de los archivos locales ejecutados:

- `experiments/geoapify-offline/ipc-cross-rotation.mjs`: `8b88effdab87f86f1f3ff79963e147bb43e5b777`.
- `experiments/geoapify-offline/ipc-exclusive.test.mjs`: `82a2c2c1d6172b504f7fa0b7625e45106f1e773c`.
- Dependencia `ipc-broker.mjs`: blob previo `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a`, sin cambios.

```text
PASS 17 mandatory SQLite owner lock assertions; 12 concurrent IPC calls
```
**Exit code 0.** La batería invoca el módulo directamente en dos procesos separados (sin `flock` externo), verifica rechazo del segundo arranque, conservación del manifiesto, denegación de lectura SQLite al UID 65534, denegación de socket al UID 65532, rechazo de symlink de manifiesto, `SIGKILL`, nueva ruta tras reinicio, replay y 12 solicitudes concurrentes rechazadas por cuota.

## Evaluación de autenticación de par
No se implementó `SO_PEERCRED`. En Node v22.16.0, `net.Socket` no proporciona una API pública documentada para leer directamente el UID remoto. Los permisos Unix `0750/0660` delimitan los UID/grupos capaces de conectar, pero **no identifican individualmente el proceso conectado**. Implementar credenciales de par requeriría una interfaz nativa auditada o un mecanismo IPC diferente, ambos fuera de este alcance. No se añadieron dependencias ni secretos.

## Riesgos residuales / NO-GO
1. **Exclusión acotada:** todas las invocaciones de `startCrossRotation()` que usen el mismo directorio privado compiten por el mismo bloqueo. `startBroker()` sigue siendo importable directamente; también puede evitarse la exclusión eligiendo otra base/directorio. No se afirma bloqueo global de todas las rutas.
2. El lock SQLite es local al sistema de archivos y no demuestra comportamiento en NFS u otros sistemas remotos. No hay protección contra root ni contra código con UID propietario comprometido.
3. La comprobación `lstatSync` del archivo de bloqueo precede a `DatabaseSync`: existe potencial TOCTOU si un atacante controla el directorio privado. Los permisos `0700` lo mitigan frente a clientes con otro UID.
4. La prueba de symlink cubre el manifiesto, no una carrera de sustitución de nanosegundos ni todos los ancestros de ruta.
5. El prototipo de prueba no contiene autenticación real de clientes ni validación de `SO_PEERCRED`. La API interna del broker de nivel inferior sigue disponible.
6. **Cobertura legacy limitada:** los módulos `idempotency-ledger.mjs`, `idempotency-norm-v2.mjs`, `shared-quota.mjs`, `unified-guarded.mjs`, `single-entry.mjs` e `ipc-broker.mjs` se inspeccionaron en fases previas. No se ha recuperado un árbol recursivo completo de la rama; no se afirma auditoría exhaustiva.
7. En esta fase se ejecutó la batería nueva de 17 aserciones; **no se reejecutaron todas las suites históricas**. El código modificado no se integra con la web ni con un servicio real.

## Próxima fase
Reducir las rutas de bypass del broker inferior, endurecer la apertura del archivo de bloqueo frente a symlinks/TOCTOU, ejecutar las baterías completas sobre el nuevo módulo y evaluar control de credenciales del par Unix sin afirmar APIs inexistentes.
