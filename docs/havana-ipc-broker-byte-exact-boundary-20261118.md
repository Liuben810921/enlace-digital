# ENLACE DIGITAL — certificación IPC y límites de privilegios (2026-11-18)

Base `53a5ebec8af1fb2435204f7f8d9d5bbf646c256c`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub `identical`.

## Diferencia de blob resuelta
El archivo local `broker.mjs` contenía una importación no usada `randomBytes`. Al retirarla y guardarlo como `ipc-broker.mjs`, `git hash-object` coincidió con el blob remoto **sin cambiar el código publicado**: `31cb72827940ea10f19ee2dafc0c2c98788ee97e`.

Se publicaron y recuperaron las dos baterías con coincidencia exacta de SHA Git:
- `ipc-broker.test.mjs` `39406b21684d1e99f3db3159af15b5733d8bccde`
- `ipc-broker.sigkill.test.mjs` `5d8bdfbc7a002460a388d13527b6d895520a1498`
- `ipc-broker.boundary.test.mjs` `af67f31d8d86b6bafdc6f49a34581b4e0b1001b8`

## Ejecución real (Node.js v22.16.0)
Las tres baterías se ejecutaron desde `/mnt/data/ed-broker` después de verificar el hash de cada archivo, con salida:
```
PASS 17 IPC broker assertions; 24 concurrent requests
PASS 9 broker SIGKILL recovery assertions
PASS 5 boundary assertions; same-UID bypass confirmed; cross-UID SQLite denial checked when root
```
**31 aserciones, tres exit code 0**. Sin GitHub Actions.

## Pruebas adicionales de frontera
- **Bloqueo SQLite:** una conexión independiente retuvo `BEGIN IMMEDIATE`; `start` vía IPC devolvió `PENDIENTE/STORAGE`. Al liberar el bloqueo, una reserva pudo confirmarse.
- **Permisos socket:** modo `0600` verificado.
- **Bypass mismo UID:** una segunda conexión SQLite pudo escribir directamente en `credits`, sin pasar por IPC. **Vulnerabilidad arquitectónica confirmada**: el broker no es frontera de seguridad efectiva si el cliente puede abrir la base con el mismo usuario.
- **UID distinto:** el contenedor de prueba ejecuta como root; se creó un proceso hijo con UID/GID 65534 y el archivo SQLite con modo `0600`. El intento de abrir la base fue rechazado. **Esta prueba es una simulación local de separación por UID**, no configuración de producción ni prueba de control del socket para usuarios distintos.
- **SIGKILL:** reserva y consumo persistieron tras reiniciar el broker; replay no duplicó operaciones.
- **Concurrencia:** 24 peticiones en paralelo con versiones alternadas, 2 reservas y 22 rechazos por cuota (con reserva previa), dentro del presupuesto compartido.

## Limitaciones y hallazgos
- No se modificó el broker: el bypass de mismo UID es un **defecto de aislamiento del despliegue propuesto**, no reparable únicamente con un condicional dentro de la biblioteca.
- La API `startBroker()` todavía devuelve `.db` a su proceso invocador y acepta tokens sintéticos configurados por el mismo; no es autorización real.
- El socket 0600 no impide que otro proceso del mismo UID lo abra; no se verificó denegación del socket bajo UID distinto.
- No se auditaron todas las importaciones de la aplicación ni se impidió acceso a los Ledgers antiguos.
- La comprobación de invariantes se ejecuta al iniciar y en `stats`, no antes de cada `start/finish`. El acceso directo concurrente a SQLite sigue siendo un riesgo.
- El broker hace `unlinkSync(socketPath)` antes de escuchar: en una implementación futura, validar propiedad y tipo de ruta para impedir sustitución de un archivo ajeno.
- `node:sqlite` en Node 22.16.0 es experimental, aunque `DatabaseSync` está disponible. Documentación: https://nodejs.org/api/sqlite.html

## Próximo paso
Construir harness de aislamiento de proceso con usuario propietario separado, directorio 0700 y socket IPC accesible a un grupo de clientes autorizado; negar acceso directo a DB y módulos internos; validar identidad del par y endurecer el ciclo de vida del socket. Mantenerlo completamente offline.

**Restricciones:** sin GitHub Actions, cuentas externas, claves, servicios, despliegues, Supabase, staging, producción, clientes ni pedidos.
