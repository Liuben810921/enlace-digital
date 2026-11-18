# ENLACE DIGITAL — Rotación IPC entre UID, exclusión y pruebas exactas (2026-11-18)

## Base y alcance
Base autorizada `9f93b78e4b71a92d47a0b6c8010334cbc7c39d41`; rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial de GitHub: `identical`. Trabajo exclusivamente offline con datos sintéticos, sin GitHub Actions, cuentas nuevas, claves reales, servicios externos, despliegues, Supabase, staging, producción ni pedidos.

## Diseño ejecutado
- Proceso broker UID 65533 / GID 65534; cliente UID 65534 / GID 65534; no se crean cuentas, se usan UID numéricos de prueba mediante `spawn`.
- Directorio de descubrimiento IPC propietario UID 65533, grupo 65534, modo `0750`. Manifiesto `current.json` modo `0640` y socket Unix `0660`; el cliente puede descubrir y conectar, pero no modificar el directorio.
- Directorio SQLite independiente propiedad de UID 65533, modo `0700`. El cliente no puede abrir la base directamente.
- Socket con nombre aleatorio en cada inicio, manifiesto publicado con archivo temporal exclusivo y `renameSync`; el broker no elimina sockets obsoletos tras `SIGKILL`.
- Bloqueo de instancia única usando la utilidad local Linux `flock -n -F` sobre archivo del directorio SQLite privado. El descriptor de bloqueo permanece en el proceso ejecutado y el kernel lo libera tras `SIGKILL`. El segundo broker no puede adquirirlo.
- El cliente valida propiedad, grupo, modos, tipo de manifiesto y socket y patrón cerrado de nombre; rechaza symlink en manifiesto. Ante errores devuelve `PENDIENTE/IPC`.

## Hashes exactos GitHub y Node.js
Archivos publicados en `experiments/geoapify-offline/` y recuperados con GitHub `fetch_file`; cada SHA se comparó con `git hash-object` de la copia local ejecutada:

| Archivo | Git blob SHA |
|---|---|
| `ipc-cross-rotation.mjs` | `e0b4d3e25ad8f72e14ca86c255912b0bd8b1b78e` |
| `ipc-cross-owner.mjs` | `9cff90075e7cda369d82d35ea995728bc9ac9844` |
| `ipc-cross-client.mjs` | `1fd230299f1b749199278ae9e7cebc1c7dab002e` |
| `ipc-cross.test.mjs` | `ca2dfc7f157edd9a01f2bfe9ea939493cf76bee3` |
| `ipc-broker.mjs` (dependencia sin cambios) | `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a` |

Ejecución real `node --disable-warning=ExperimentalWarning ipc-cross.test.mjs`, Node v22.16.0, contenedor local como root para lanzar procesos sintéticos con UID distintos. **Exit 0**:
```text
PASS 16 cross-UID rotation assertions; 12 concurrent processes
```

Casos: permisos `0750` y `0660`, denegación de lectura SQLite al cliente, conexión autorizada, cuota compartida legacy/NORM-v2, bloqueo de segundo broker, manifiesto symlink rechazado, recuperación de manifiesto válido, SIGKILL, nueva ruta de socket, replay sin doble reserva y 12 procesos concurrentes rechazados por cuota.

## Auditoría legacy: cobertura limitada y demostrable
Se revisaron en la fase previa los archivos `idempotency-ledger.mjs`, `idempotency-norm-v2.mjs`, `shared-quota.mjs`, `unified-guarded.mjs`, `single-entry.mjs` y `ipc-broker.mjs` en la rama aislada. Se confirmó que las clases originales exportadas pueden abrir SQLite sin pasar por el broker. **No se obtuvo el árbol recursivo completo de la rama**, y la búsqueda de código GitHub consulta la rama predeterminada: no se certifica auditoría exhaustiva de todas las importaciones o consumidores.

## Riesgos abiertos y NO-GO
1. La exclusión `flock` es una **convención del lanzador**: un actor que ejecute `startCrossRotation` sin `flock` puede iniciar otro broker. Para imponerla, el bloqueo debe ser obligatorio en una capa de lanzamiento controlada y revisada. No se integró ningún lanzador operativo.
2. El manifiesto es visible para el grupo autorizado, pero no autentica criptográficamente al cliente ni valida `SO_PEERCRED`. Cualquier proceso que pertenezca al grupo y conozca la credencial sintética podría conectarse.
3. Se usa `lstatSync` y después `readFileSync`: no se elimina formalmente toda carrera TOCTOU. El directorio no escribible por el grupo mitiga ataques de clientes no propietarios.
4. Un proceso root o con UID 65533 puede eludir los permisos; el modelo no protege contra un propietario comprometido.
5. No se ejecutó ataque adversarial que altere el manifiesto exactamente entre validación y apertura, ni se ensayó fallo de energía/durabilidad de `renameSync` con `fsync`.
6. No hay control de peer UID nativo con Node v22.16.0, ni autenticación real, ni integración con la aplicación, ni auditoría completa de imports. El broker usa tokens sintéticos y `node:sqlite` experimental.
7. El diseño conserva sockets obsoletos tras fallos; la limpieza futura debe estar fuera del camino crítico, con controles de propiedad y ausencia de clientes activos.

**Conclusión:** el aislamiento de permisos, descubrimiento entre UID, bloqueo cooperativo, recuperación y concurrencia fueron probados offline en el harness exacto. No autorizado para producción.
