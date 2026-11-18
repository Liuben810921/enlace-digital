# ENLACE DIGITAL — rotación pendiente, consumidores de startBroker y manifiestos adversariales (2026-11-18)

## Base y alcance
Base autorizada `aa8645ec6841c218be02de22353fa13b302212f7`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación GitHub inicial `identical`. Exclusivamente experimentos offline, sin GitHub Actions, cuentas, claves, servicios externos, despliegues, Supabase, staging, producción ni pedidos.

## Reejecución real Node.js v22.16.0
Archivos de las pruebas de rotación recuperados de la rama y comprobados contra `git hash-object` de las copias ejecutadas:
- `ipc-rotation.mjs`: `045538e8f4a33d8157cb3b28c9bb0288853863fe`.
- `ipc-rotation.test.mjs`: `b5c46c3b04d9d86eb9d316b192cd3eaf5d501965`.
- `ipc-rotation.kill.test.mjs`: `af0a8cb438424ea0ee04911a1ee1c0b481c6a315`.
- `ipc-cross.test.mjs`: `a050d14cd38ba0cb48c42be52cb204bfc36cc6f2`.
- `ipc-cross-rotation.mjs`: `88b5f6d04241dc813703d8962d91e20a69aa9e88`.
- `ipc-lock-path.test.mjs`: `f3ef8d5f47cdbbafd3ce3cd7e06dabd5efc8ea02`.
- `ipc-manifest-adversarial.test.mjs`: `a6d4878c6bbd37e9928cc0e2c4f3329933505a5a` (nuevo, publicado y comprobado).

Salida real de siete baterías independientes (todas exit code 0):
```text
PASS 11 SIGKILL rotation and concurrency assertions; 24 requests
PASS 15 rotation assertions; no stale socket unlinked
PASS 17 mandatory SQLite owner lock assertions; 12 concurrent IPC calls
PASS 17 mandatory SQLite owner lock assertions; 12 concurrent IPC calls
PASS 10 lock-path adversarial assertions
PASS 18 cross-UID rotation assertions; 12 concurrent processes
PASS 10 manifest adversarial assertions
```
Total de **98 ejecuciones de aserción** en siete ejecuciones de prueba, pero una de las dos baterías de 17 es duplicada (`exclusive.test.mjs` e `ipc-exclusive.test.mjs`), por lo que son **81 aserciones no duplicadas** entre seis baterías distintas. La batería nueva de manifiesto rechazó symlink, JSON inválido, traversal, versión incorrecta, modos inseguros de archivo y directorio; recuperó el manifiesto legítimo. No se ha ejecutado un ataque de carrera temporal precisa.

## Consumidores demostrables de startBroker
Inspección de archivos exactos en la rama aislada mediante GitHub `fetch_file`:
- `ipc-broker.test.mjs` (SHA `5407b89c49d00e04c6ec96681e681d382948d2d6`): importación y llamadas directas de test.
- `ipc-broker.sigkill.test.mjs` (SHA `e8a902dfa12fa9f825418721efc377161d7d7775`): proceso de prueba y recuperación tras SIGKILL.
- `ipc-broker.boundary.test.mjs` (SHA `af67f31d8d86b6bafdc6f49a34581b4e0b1001b8`): test de frontera.
- `ipc-isolation.owner.mjs` (SHA `1d30402546c287e40bc65126da15646eeea37cd9`): wrapper propietario anterior.
- `ipc-rotation.mjs` (SHA `045538e8f4a33d8157cb3b28c9bb0288853863fe`): prototipo de rotación de un UID.
- `ipc-cross-rotation.mjs` (SHA `88b5f6d04241dc813703d8962d91e20a69aa9e88`): prototipo de rotación entre UID, ahora con bloqueo interno.

**Cobertura:** seis archivos inspeccionados directamente. No se dispone de árbol recursivo completo de la rama ni se afirma que sean los únicos consumidores.

## Restricción compatible propuesta, no implementada
Separar la API histórica de pruebas de una entrada autorizada de ejecución. La entrada autorizada debe pasar por `startCrossRotation` y su bloqueo SQLite interno, y la distribución/ejecución debe impedir a los consumidores no autorizados cargar el módulo inferior. Mantener el módulo histórico únicamente en el paquete/harness de pruebas hasta migrar consumidores conocidos. No retirar ahora `startBroker` ni afirmar bloqueo global: un import directo desde el mismo UID puede saltar el bloqueo.

## Riesgos y próximos pasos
- La apertura SQLite por ruta tras `O_NOFOLLOW` mantiene ventana TOCTOU; el directorio privado `0700` mitiga accesos de UID distintos.
- El manifiesto se comprueba con `lstatSync` y después se abre por ruta; tampoco existe garantía absoluta frente a sustitución por el propietario o root.
- `SO_PEERCRED` no se implementó ni se probó; los permisos de socket no autentican individualmente el UID remoto.
- Los módulos legacy de SQLite siguen importables; no hay auditoría exhaustiva de todo el árbol.
- No se cambió el broker inferior ni se integró la fachada con la web operativa. No se reejecutó la totalidad de pruebas de otros componentes del repositorio.

**Conclusión:** las baterías de rotación pendientes se reejecutaron correctamente, la cobertura adversarial se amplió con diez aserciones, y se documentó una ruta de migración compatible sin introducir cambios operativos.
