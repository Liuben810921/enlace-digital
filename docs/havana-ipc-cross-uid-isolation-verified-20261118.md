# ENLACE DIGITAL — separación real de UID en IPC SQLite (2026-11-18)

**Base autorizada:** `f829fe89bfd2711931492fd2ee2eae0a0d84e1e9`. **Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial de GitHub: `identical`.

## Archivos publicados y equivalencia byte a byte

| Archivo | SHA Git blob |
|---|---|
| `experiments/geoapify-offline/ipc-broker.mjs` (sin cambios) | `31cb72827940ea10f19ee2dafc0c2c98788ee97e` |
| `experiments/geoapify-offline/ipc-isolation.owner.mjs` | `13f8c23a29f9860e32af76c22130f4b3e408c22b` |
| `experiments/geoapify-offline/ipc-isolation.client.mjs` | `bf99c37af23b188f53f77d40d97fb2d3bd86a62a` |
| `experiments/geoapify-offline/ipc-isolation.test.mjs` | `e87bf8af2a0456450e7afef22eca251a0618c871` |

Se verificaron hashes locales con `git hash-object` contra los SHA publicados en GitHub y se ejecutó la batería exacta en Node.js **v22.16.0**. La carpeta de ejecución fue `/mnt/data/ed-isolation`.

```text
PASS 15 cross-UID IPC and SQLite isolation assertions; 12 concurrent clients
```

**Resultado:** exit code 0, 15 aserciones aprobadas. No se ejecutaron GitHub Actions.

## Hallazgo reproducido y corrección

La primera ejecución falló con `EACCES` porque el directorio IPC era propiedad de root y tenía permisos `0755`, por lo que el proceso propietario de SQLite (UID 65533) no podía crear el socket. Se corrigió **únicamente el harness de prueba**: directorio IPC `0750` propiedad del UID 65533 y grupo 65534; directorio DB `0700` propiedad del UID 65533. El socket se ajusta a `0660`. No se modificó `ipc-broker.mjs`.

Se añadió verificación del directorio IPC y rechazo de rutas preexistentes que no sean sockets propios del UID 65533. Esta verificación evita borrar archivos ordinarios o enlaces simbólicos en condiciones normales, pero no es protección completa contra TOCTOU en directorios manipulables.

## Resultados comprobados

- Proceso broker: UID 65533, GID 65534. Proceso cliente autorizado: UID 65534, GID 65534. Se usan UID numéricos efímeros mediante `spawn({uid,gid})` sin crear cuentas.
- El cliente no puede leer ni escribir directamente el archivo SQLite dentro del directorio `0700`.
- El cliente sí puede solicitar operaciones mediante el socket `0660` y la credencial **ficticia de prueba**.
- Un tercer proceso con UID/GID 65532 no puede conectarse al socket.
- `legacy` y `NORM-v2` comparten dos reservas; la tercera se rechaza por `QUOTA`.
- `SIGKILL` del broker y posterior reapertura: el mismo ID responde `ALREADY_TRACKED`, y las reservas persistentes no se duplican.
- `PRAGMA integrity_check` devuelve `ok`; dos reservas persistentes en SQLite.
- Doce procesos clientes adicionales con versiones alternadas compiten simultáneamente y todos reciben `QUOTA` cuando ya se alcanzó el límite.

## Limitaciones y NO-GO

1. La batería requiere ejecutarse como root **solo en el contenedor sintético** para lanzar procesos con UID distintos; no se cambiaron usuarios ni cuentas del sistema. Un proceso root puede acceder a la base y no está restringido por este modelo.
2. La credencial de prueba está escrita en código y no constituye autenticación real. La identidad del par Unix no se valida mediante `SO_PEERCRED`; la separación se basa en permisos de sistema y una credencial sintética.
3. El broker original continúa exponiendo `.db` a su proceso invocador; no debe exponerse a clientes ni integrarse así en una aplicación operativa.
4. La protección contra sustitución de ruta del socket se implementó en el wrapper de prueba; **no se ha corregido** el `unlinkSync(socketPath)` inseguro dentro del broker general. Se requiere endurecimiento previo a despliegue.
5. El harness no incluye una prueba adversarial automatizada de sustitución de socket durante una carrera TOCTOU; tampoco cubre ACL, namespaces, contenedores con capacidades elevadas ni todas las rutas legacy de la aplicación.
6. No hay integración con aplicación real ni migración de los Ledger originales. La frontera es efectiva solo en este harness aislado con privilegios configurados como se indica.
7. Sin GitHub Actions, cuentas externas, claves reales, servicios externos, despliegues, Supabase, staging, producción, clientes ni pedidos.

## Siguiente fase

Eliminar de la API pública la exposición de SQLite; asegurar de manera atómica la ruta del socket y el ciclo de vida del broker; añadir pruebas adversariales de rutas, symlinks, reconexión, cierres y control del par Unix, manteniendo todo offline.
