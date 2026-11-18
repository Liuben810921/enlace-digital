# ENLACE DIGITAL — broker SQLite IPC offline (2026-11-18)

Base `b056dbd99082610948463ec27984e4d968d1b70e`, rama `plan/havana-osrm-benchmark-offline-20261114`; compare inicial `identical`.

## Código publicado
`experiments/geoapify-offline/ipc-broker.mjs` publicado en `f64fa48a4f8902ad1a32d109f58c7fd0d1197d4c`. SHA blob GitHub confirmado por fetch: `31cb72827940ea10f19ee2dafc0c2c98788ee97e`.

La implementación local ensayada fue `/mnt/data/ed-broker/broker.mjs`, Git blob `e2da50cd523b9c6b12d441c823c1352ed615c752`, SHA256 `d27d97a6b3465925dcd7247b24bbfac6da842871bab8b815fdb74a216895f037`.

**Advertencia de verificación:** los blobs publicados y locales **NO coinciden**. Por tanto, las pruebas siguientes certifican el prototipo local, pero **no** la ejecución byte a byte del archivo publicado. Se requiere recuperar el archivo publicado, comparar, corregir cualquier divergencia y repetir las pruebas exactas antes de integrar.

## Ejecuciones Node.js reales
Node v22.16.0, `node:sqlite`, contenedor local sin red:
```
PASS 17 IPC broker assertions; 24 concurrent requests
PASS 9 broker SIGKILL recovery assertions
```
Exit 0 en ambos comandos. Los tests locales se conservan en `/mnt/data/ed-broker/broker.test.mjs` y `broker.sigkill.test.mjs`, pero **todavía no están publicados en GitHub**. No se afirma lo contrario.

## Casos comprobados localmente
- Protocolo IPC JSON por socket Unix, operaciones cerradas `start`, `finish`, `stats`, límite 8192 bytes y `PENDIENTE` ante error.
- Credenciales sintéticas preconfiguradas por broker; token ajeno rechazado y conflicto de identidad detectado.
- Dos versiones `legacy` y `NORM-v2` compiten por una cuota común y un ID global.
- 24 peticiones simultáneas: 2 reservas, 22 rechazos por cuota, sobre una reserva previa del mismo día.
- Cambio de día, reinicio, detección de corrupción sintética, auditoría de contadores y SQLite `integrity_check`.
- Socket con modo `0600`.
- `SIGKILL` del proceso broker, reapertura y persistencia de reservas y consumos; 9 aserciones.

## Límites de seguridad y defectos pendientes de evaluar
- **No hay aislamiento entre usuarios del sistema operativo probado**: el contenedor ejecuta bajo root. Un proceso con privilegios de root puede abrir SQLite o el socket independientemente de los permisos.
- El prototipo acepta tokens sintéticos inyectados por configuración de prueba, no autenticación real ni credenciales productivas.
- `startBroker` devuelve `.db` para facilitar auditoría de pruebas; esto no debe exponerse a clientes en un despliegue. No hay despliegue autorizado.
- No se ha realizado un escaneo exhaustivo de importaciones de toda la aplicación; los Ledger originales siguen importables.
- La detección de inconsistencias en `audit()` se realiza al iniciar y en `stats`; las operaciones `start/finish` no vuelven a ejecutar `audit()` en cada solicitud. Si otro actor modifica el archivo mientras está abierto, el prototipo no garantiza fallo cerrado inmediato.
- El servidor no implementa límites de conexiones simultáneas, ni límites de profundidad del JSON, ni control de UID del par remoto; la prueba de permisos 0600 no equivale a aislamiento fuerte.
- El test de corrupción verifica rechazo de un archivo no SQLite, no recuperación automática.
- El bloqueo SQLite desde otro proceso no se ensayó en esta fase del broker; no afirmar que fue aprobado.
- No hay servicios externos, GitHub Actions, cuentas, claves, despliegues, Supabase, staging, producción, clientes ni pedidos.

## Siguiente fase
1. Publicar tests exactos y corregir divergencia de blob del broker; ejecutar los archivos publicados byte a byte.
2. Probar permisos con dos usuarios no privilegiados, o documentar imposibilidad del entorno.
3. Pruebas negativas de bypass por apertura directa, lock SQLite y límites de conexiones.
4. Eliminar exposición de `.db` en interfaz pública y separar APIs de auditoría, con tests antes de cualquier integración.
