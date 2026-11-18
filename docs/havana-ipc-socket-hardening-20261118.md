# ENLACE DIGITAL — endurecimiento IPC y pruebas adversariales (2026-11-18)

Base: `98993f29e1ff03e2df1eff0fe23f94a9a451b4a7`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: `identical`.

## Código y hashes verificados
Se compararon copias locales mediante `git hash-object` con los blobs publicados y recuperados de GitHub:
- `ipc-broker.mjs`: `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a`
- `ipc-isolation.owner.mjs`: `1d30402546c287e40bc65126da15646eeea37cd9`
- `ipc-hardening.test.mjs`: `fc2398eaa4abdb186a1e38154843c3388c416e42`
- `ipc-isolation.test.mjs` (sin cambios): `e87bf8af2a0456450e7afef22eca251a0618c871`

## Ejecución real Node v22.16.0
```text
PASS 12 socket hardening assertions
PASS 15 cross-UID IPC and SQLite isolation assertions; 12 concurrent clients
```
Ambas baterías: exit code 0, **27 aserciones**. Se ejecutaron sobre archivos byte a byte idénticos a los publicados.

Pruebas: archivo ordinario y symlink en ruta del socket no se borran; directorio con escritura grupal/mundial rechazado; API no expone `db` ni `audit` y está congelada; cierre normal y reapertura con replay; separación de UID 65533 (broker) y UID 65534 (cliente), denegación SQLite directa, tercero UID 65532 sin acceso al socket, cuotas legacy/NORM-v2, SIGKILL, recuperación y 12 clientes concurrentes.

**Defecto reproducido y corregido:** el broker previo llamaba a `unlinkSync(socketPath)` indiscriminadamente y devolvía `.db` y `.audit` al llamador. El nuevo broker falla cerrado si la ruta está ocupada y exige directorio no escribible por grupo ni otros; la API pública devuelve solo `close`. El wrapper propietario de pruebas retira un socket obsoleto solo si es un socket del UID esperado. Sigue existiendo ventana TOCTOU entre `lstatSync` y `unlinkSync`, mitigada por el directorio propietario de acceso restringido, pero no eliminada formalmente.

## Investigación UID remoto
En Node.js **v22.16.0**, `net.Socket.prototype.getPeerCredentials` no está disponible (`typeof === 'undefined'`). El broker no puede afirmar validación directa de `SO_PEERCRED` con esta API. Se comprobaron permisos del socket y directorio mediante procesos de UID distintos. Una verificación de credenciales de par requeriría una API nativa/FFI revisada o una capa de IPC que exponga `SO_PEERCRED`, no autorizada ni implementada aquí. Los tokens son ficticios, no autenticación productiva.

## Regresiones detectadas (pendientes)
Se reejecutaron las tres baterías antiguas sobre el broker endurecido:
- `ipc-broker.boundary.test.mjs`: PASS 5.
- `ipc-broker.test.mjs`: **FAIL** por uso obsoleto de `broker.audit()`, ahora eliminado deliberadamente de la API pública.
- `ipc-broker.sigkill.test.mjs`: **FAIL** al reiniciar porque el broker ya no borra sockets obsoletos automáticamente; el test antiguo no aplica la recuperación del wrapper propietario.

Estas son incompatibilidades de tests anteriores con el contrato endurecido. **No se han corregido ni vuelto a ejecutar exitosamente en esta fase**; no se debe afirmar suite integral verde. La batería nueva de aislamiento sí prueba recuperación tras SIGKILL con wrapper de propietario. Antes de cerrar la fase, actualizar las pruebas antiguas para auditar SQLite fuera de la API pública y limpiar sockets obsoletos únicamente en directorio seguro.

## Límites / NO-GO
- No existe autenticación real del UID remoto mediante `SO_PEERCRED`.
- Los clientes del mismo UID del broker y root pueden eludir la frontera si acceden al archivo SQLite. Los UID distintos están restringidos solo en el harness sintético.
- No hay mitigación formal de todas las carreras de sustitución de ruta, de symlinks en directorios ancestros ni de un atacante con privilegios del propietario.
- El broker no hace auditoría de invariantes en cada operación; no hay análisis exhaustivo de JSON adversarial ni auditoría completa de importaciones legacy.
- Sin GitHub Actions, cuentas, claves reales, servicios externos, despliegues, Supabase, staging, producción, clientes ni pedidos.
