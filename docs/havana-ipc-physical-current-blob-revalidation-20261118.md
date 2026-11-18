# ENLACE DIGITAL — Revalidación física IPC con blob actual exacto (2026-11-18)

## Control de base
Commit autorizado `94a305cacbd010db7ff0ae126c1dc1a550d2838c`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial de GitHub `identical`. Se conservaron intactos los módulos históricos; solo se publica este informe. No se utilizaron GitHub Actions, cuentas, claves, servicios externos, despliegues, Supabase, staging, producción ni pedidos.

## Corrección de cobertura anterior
El informe `havana-ipc-physical-uid-isolation-20261118.md` documentaba correctamente que el harness físico anterior se había ejecutado con el blob histórico `e0b4d3e25ad8f72e14ca86c255912b0bd8b1b78e`. Esta fase sustituyó **únicamente la copia local de ejecución** por `ipc-cross-rotation.mjs` blob actual `88b5f6d04241dc813703d8962d91e20a69aa9e88`, obtenido de la copia local previamente verificada contra GitHub. La rama GitHub no requirió cambios de código.

## Hashes Git exactos
Se calcularon con `git hash-object` sobre los archivos locales efectivamente utilizados y se cotejaron con los SHA obtenidos mediante `fetch_file` de la rama:
- `ipc-cross-rotation.mjs`: `88b5f6d04241dc813703d8962d91e20a69aa9e88`.
- `ipc-physical-isolation.test.mjs`: `72e1df0b93b29e4d1dc4395f8de039df6dba9304`.
- `ipc-unprivileged-client.mjs`: `da0333384ea6b091f02272ed091e22001c792de1`.
- `ipc-unprivileged-probe.mjs`: `bf0f9fef04898a837ce98043b97f6e7ba2f25f93`.
- `ipc-cross-launch.sh`: `e7d28f45ab9343bdf1c294341e114645d2420ee5`.
- `ipc-cross-owner.worker.mjs`: `9cff90075e7cda369d82d35ea995728bc9ac9844`.
- `ipc-broker.mjs`: `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a`.

## Ejecución real
Linux, Node.js `v22.16.0`, harness local con UID 0 para iniciar procesos sintéticos UID 65533, 65534 y 65532 sin crear cuentas. Comandos y resultados:
```sh
cd /mnt/data/ed-physical
node --disable-warning=ExperimentalWarning ipc-physical-isolation.test.mjs
# PASS 14 physical UID isolation assertions; 12 concurrent clients
```
Exit code 0. La prueba cubrió permisos de directorio, lectura directa SQLite denegada al UID cliente, conexión al socket denegada a UID/GID externos, intento de importar e iniciar módulo propietario desde UID cliente, reserva IPC, rechazo de segundo lanzador, symlink de manifiesto, recuperación de manifiesto, `SIGKILL`, recuperación con replay persistente y 12 clientes concurrentes con cuota.

Se reejecutaron además las tres baterías focalizadas contra el mismo blob actual de rotación, en otra carpeta local de pruebas:
```text
PASS 17 mandatory SQLite owner lock assertions; 12 concurrent IPC calls
PASS 10 lock-path adversarial assertions
PASS 10 manifest adversarial assertions
```
Las cuatro baterías terminaron con exit code 0: **51 aserciones**, de las cuales 14 corresponden al harness físico revalidado y 37 a regresión focalizada. No se modificaron los archivos de test ni los módulos históricos.

## Garantías demostradas y límites
- **Demostrado en este harness:** separación de proceso propietario y cliente por permisos Unix, denegación de SQLite al UID cliente, conexión de grupo autorizada, denegación a UID/GID externos, bloqueo del segundo lanzador, recuperación tras `SIGKILL`, cuotas persistentes y rechazo de manifiesto simbólico.
- **No demostrado:** aislamiento global frente a procesos con UID propietario/root; imposibilidad de importar código fuente; control de credenciales remotas `SO_PEERCRED`; eliminación completa de TOCTOU. `startBroker` sigue exportado desde el módulo histórico.
- `ipc-physical-isolation.test.mjs` verifica que el intento de **iniciar** el broker como UID cliente falla; no exige que la mera importación del módulo falle. El cliente de producción experimental solo importa `node:net` y módulos de sistema.
- La batería de sustitución de manifiesto cubre cambios secuenciales, no una carrera temporal arbitraria.
- Las comprobaciones no sustituyen una revisión de permisos, distribución de código y aislamiento de procesos en infraestructura real.

**Resultado:** la brecha de cobertura anterior (harness físico probado solo con blob histórico) queda cerrada para los casos expresamente ejecutados, sin cambios de código ni despliegues.
