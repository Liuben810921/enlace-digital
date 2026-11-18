# ENLACE DIGITAL — exclusión del lanzador IPC y controles adversariales (2026-11-18)

Base autorizada: `a9b081c11e1986f649bf2c49138c8c6d6e05eadc`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Hallazgo reproducido
La primera tentativa de endurecer el lanzador usó `node:child_process.spawn('flock',...)` desde un proceso Node padre. Al enviar `SIGKILL` al padre, el hijo siguió vivo, por lo que la solicitud posterior devolvió `ALREADY_TRACKED` en lugar de `IPC`. Este resultado reprodujo una **fuga de proceso**: el bloqueo no seguía el ciclo de vida del proceso supervisor.

## Corrección aplicada
- Nuevo `ipc-cross-launch.sh` valida UID/GID numéricos sintéticos, cantidad de argumentos y propiedad/modo del directorio privado; ejecuta `exec flock -n -F -E 73 ... node ipc-cross-owner.worker.mjs`. El shell queda reemplazado por el proceso protegido con el bloqueo.
- `ipc-cross-owner.worker.mjs` contiene el código propietario previamente invocado por el lanzador.
- `ipc-cross-owner.mjs` (entrada directa histórica) ahora falla cerrado con `DIRECT_OWNER_ENTRY_DISABLED_USE_IPC_CROSS_LAUNCH`.
- `ipc-cross.test.mjs` usa el lanzador obligatorio y amplía pruebas de UID tercero no autorizado y rechazo de entrada directa.

## Ejecución local verificable
Entorno: Linux, Node v22.16.0, `/usr/bin/flock`, contenedor root **solo para crear procesos de prueba con UID 65533, 65534 y 65532**, sin crear cuentas.

Primera ejecución con supervisor Node: **FAIL** reproducido, `ALREADY_TRACKED` en lugar de `IPC` tras `SIGKILL`.

Después de corregir con `exec flock`:
```
PASS 16 cross-UID rotation assertions; 12 concurrent processes
PASS 18 cross-UID rotation assertions; 12 concurrent processes
```
La última ejecución corresponde al código final, **18 aserciones, exit code 0**. Comprueba exclusión de un segundo lanzador, recuperación tras `SIGKILL`, rotación de socket, manifiesto symlink rechazado, acceso SQLite denegado al cliente UID 65534, socket inaccesible para UID 65532, entrada directa antigua deshabilitada y doce procesos concurrentes sin superar cuota.

## Hashes Git verificados
Se compararon `git hash-object` de los archivos locales ejecutados con los blobs recuperados desde GitHub:
- `ipc-cross-launch.sh`: `e7d28f45ab9343bdf1c294341e114645d2420ee5`
- `ipc-cross-owner.worker.mjs`: `9cff90075e7cda369d82d35ea995728bc9ac9844`
- `ipc-cross.test.mjs`: `a050d14cd38ba0cb48c42be52cb204bfc36cc6f2`
- `ipc-cross-owner.mjs`: `208f7f060f06ed732f195571b5504d2a92f61f62` (publicado y recuperado; falla cerrado)

Dependencias `ipc-cross-rotation.mjs` y `ipc-broker.mjs` sin cambios.

## Evaluación de autenticación del par
`net.Socket` en Node v22.16.0 no expone `getPeerCredentials` ni una API documentada directa para `SO_PEERCRED`. El prototipo controla el acceso mediante permisos Unix de directorio y socket, no mediante autenticación del UID del proceso remoto. Alternativas conceptuales: componente nativo auditado para `getsockopt(SO_PEERCRED)`, servicio IPC del sistema con identidad de par o credenciales de aplicación gestionadas de forma segura. **No se implementó ni probó ninguna de estas alternativas**; no se añadieron dependencias, claves ni servicios.

## Auditoría legacy: alcance demostrado
En el trabajo anterior se inspeccionaron en la rama aislada `idempotency-ledger.mjs`, `idempotency-norm-v2.mjs`, `shared-quota.mjs`, `unified-guarded.mjs`, `single-entry.mjs` y `ipc-broker.mjs`. Persisten clases exportadas que pueden abrir SQLite sin broker. No existe inventario recursivo completo de la rama en esta ejecución; **no se afirma exhaustividad**. No se cambiaron los módulos legacy.

## Limitaciones y NO-GO
1. La exclusión es obligatoria para el **lanzador controlado** y la entrada antigua está deshabilitada, pero `ipc-cross-owner.worker.mjs` y `startCrossRotation` siguen importables: un actor con permisos para ejecutarlos puede saltarse el lanzador. No existe garantía de exclusión global impuesta por la propia API.
2. El `flock` depende de Linux y del comportamiento del sistema de archivos; no es un bloqueo distribuido.
3. El cliente de un grupo autorizado puede conectarse si conoce la credencial sintética; no se verifica `SO_PEERCRED`.
4. La validación `lstatSync` + `readFileSync` conserva posible TOCTOU frente a un atacante que controle el directorio. El directorio `0750` mitiga el ataque de clientes UID distintos, pero no protege contra propietario comprometido o root.
5. No se ejecutó un ataque de carrera de nanosegundos sobre el manifiesto ni se revisó todo el árbol de importaciones. Las pruebas previas del broker no se reejecutaron en esta fase.
6. El prototipo no es apto para producción y no modifica aplicaciones operativas.

Restricciones cumplidas: sin GitHub Actions, cuentas nuevas, claves, servicios externos, despliegues, Supabase, staging, producción ni pedidos.
