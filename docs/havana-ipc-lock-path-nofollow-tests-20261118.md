# ENLACE DIGITAL — endurecimiento del archivo de bloqueo IPC (2026-11-18)

## Base y alcance
Base autorizada: `00c9513d3c1d62ba67a22d84e06f661c0c665bd2`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`. Solo código experimental offline; no GitHub Actions, cuentas nuevas, claves, servicios externos, despliegues, Supabase, staging, producción ni pedidos.

## Cambio reproducido
En `ipc-cross-rotation.mjs`, la versión anterior realizaba `lstatSync(lockPath)`, seguida de `new DatabaseSync(lockPath)` y `chmodSync(lockPath,0600)`. Una ruta cambiada por un symlink entre comprobación y apertura podía hacer que SQLite o chmod operaran sobre otro archivo. El código anterior dependía del directorio privado `0700` y no tenía `O_NOFOLLOW` para la primera apertura.

Se sustituyó por:
- `openSync(lockPath,O_RDWR|O_CREAT|O_NOFOLLOW,0600)`.
- `fstatSync(fd)` y `lstatSync(lockPath)`, comprobando archivo regular, UID propietario, modo privado, mismo `dev` e `ino`.
- `fchmodSync(fd,0600)`, que actúa sobre el descriptor y no sigue una ruta distinta.
- Apertura SQLite seguida de nueva verificación `lstatSync` de identidad `dev/ino`.
- Limpieza de conexión y descriptor en cierre normal y fallos de arranque; bloqueo `BEGIN IMMEDIATE` sigue vivo mientras funciona el broker.
- Rechazo de symlink, directorio, archivo con permisos inseguros y doble inicio.

**Limitación técnica esencial:** `DatabaseSync` de Node v22.16.0 acepta ruta y no un descriptor de archivo para esta API. Existe una ventana de carrera entre la primera apertura con `O_NOFOLLOW` y la apertura independiente que realiza SQLite. Los controles de inodo detectan cambios observables después de abrir, pero **no garantizan ausencia total de TOCTOU**. El directorio privado `0700` limita al adversario de UID diferente; no protege frente a root o propietario comprometido.

## Ejecución real: siete baterías
Node.js v22.16.0, Linux, UID 0 solo para lanzar procesos sintéticos con UID distintos, sin crear cuentas. Todos los comandos terminaron con **exit code 0**:

```text
PASS 10 lock-path adversarial assertions
PASS 17 mandatory SQLite owner lock assertions; 12 concurrent IPC calls
PASS 17 IPC broker assertions; 24 concurrent requests
PASS 9 broker SIGKILL recovery assertions
PASS 5 boundary assertions; same-UID bypass confirmed; cross-UID SQLite denial checked when root
PASS 14 socket hardening assertions
PASS 15 cross-UID IPC and SQLite isolation assertions; 12 concurrent clients
```

Total: **87 aserciones** en 7 baterías. Las baterías del broker histórico se ejecutaron sobre su versión exacta sin cambios. Las dos baterías del módulo de rotación usaron la versión modificada. No se reejecutaron las dos baterías de rotación anteriores (`ipc-rotation.test.mjs` y `ipc-rotation.kill.test.mjs`) ni `ipc-cross.test.mjs`; por tanto **no se afirma que todas las baterías del repositorio estén verdes**.

## Hashes exactos
Se compararon los hashes `git hash-object` de los archivos locales ejecutados con los SHA publicados/recuperados de GitHub:

| Archivo en experiments/geoapify-offline/ | SHA Git |
|---|---|
| `ipc-cross-rotation.mjs` | `88b5f6d04241dc813703d8962d91e20a69aa9e88` |
| `ipc-lock-path.test.mjs` | `f3ef8d5f47cdbbafd3ce3cd7e06dabd5efc8ea02` |
| `ipc-exclusive.test.mjs` | `82a2c2c1d6172b504f7fa0b7625e45106f1e773c` |
| `ipc-broker.mjs` | `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a` |
| `ipc-broker.test.mjs` | `5407b89c49d00e04c6ec96681e681d382948d2d6` |
| `ipc-broker.sigkill.test.mjs` | `e8a902dfa12fa9f825418721efc377161d7d7775` |
| `ipc-broker.boundary.test.mjs` | `af67f31d8d86b6bafdc6f49a34581b4e0b1001b8` |
| `ipc-hardening.test.mjs` | `a2911def7491a9ddeedc29bda04a4c4d8e49fe95` |
| `ipc-isolation.test.mjs` | `e87bf8af2a0456450e7afef22eca251a0618c871` |

## Análisis de bypass y credenciales
`startBroker()` sigue exportado desde `ipc-broker.mjs`, por lo que puede invocarse directamente sin el bloqueo interno de `startCrossRotation()`. No se modificó porque sus consumidores y pruebas históricas dependen de la API; una restricción irreversible sin inventario completo podría romper experimentos. La exclusión es obligatoria **solo para instancias que usen `startCrossRotation()` y el mismo directorio privado**. Los módulos legacy de SQLite continúan siendo otra vía de bypass para procesos privilegiados o con UID propietario. No se afirma auditoría exhaustiva de todo el árbol.

No se implementó ni probó `SO_PEERCRED`; la API pública `node:net` de Node v22.16.0 no expone directamente credenciales UID del par. Los permisos de socket y directorio no equivalen a autenticación individual de procesos. No se añadieron servicios, dependencias ni claves.

## Próximo paso / NO-GO
- Evaluar un aislamiento de proceso/paquete que impida importar el broker inferior desde consumidores no autorizados, sin romper las suites históricas.
- Evaluar apertura SQLite por descriptor mediante componente auditado o alternativa IPC, si se requiere eliminar la carrera de ruta; no introducir dependencias externas sin autorización.
- Añadir pruebas adversariales controladas de sustitución durante la apertura, y reejecutar también las baterías de rotación previas si se requiere cobertura integral.
- Mantener el prototipo fuera de producción, staging y cualquier operación real.
