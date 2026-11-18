# ENLACE DIGITAL — cierre de regresiones IPC y suite exacta (2026-11-18)

## Alcance y base

Base autorizada `f9c67709567cd34c13376ac63d04197d6767e391`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial de GitHub `identical`. Sin GitHub Actions, cuentas, claves reales, servicios externos, despliegues, Supabase, staging, producción, clientes ni pedidos.

## Correcciones de las dos regresiones históricas

1. `ipc-broker.test.mjs`: eliminados los usos de `broker.audit()` y `broker.db`. La auditoría abre una conexión SQLite independiente **exclusivamente dentro del test**, compara filas `credits` con los estados `ops` y ejecuta `PRAGMA integrity_check`. La inyección de inconsistencia se realiza con esa conexión externa de test. La API pública del broker permanece congelada y devuelve solamente `close`.
2. `ipc-broker.sigkill.test.mjs`: la recuperación de socket tras `SIGKILL` se hace únicamente en el directorio temporal del test y solo si `lstatSync` confirma un socket cuyo UID coincide con el del proceso de prueba. No se restauró la eliminación automática del broker. Sigue existiendo una ventana TOCTOU entre comprobar y eliminar; esta rutina no debe trasladarse sin más a un entorno no controlado.

Se amplió `ipc-hardening.test.mjs`: servidor Unix externo ocupa la ruta; el broker debe rechazarla sin borrar el socket ni interrumpir el listener.

## Hashes exactos

Se recuperaron de GitHub los blobs de los ocho archivos siguientes y se verificó igualdad byte a byte con `git hash-object` de las copias ejecutadas:

| Archivo (experiments/geoapify-offline/) | SHA Git |
|---|---|
| `ipc-broker.mjs` | `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a` |
| `ipc-broker.test.mjs` | `5407b89c49d00e04c6ec96681e681d382948d2d6` |
| `ipc-broker.sigkill.test.mjs` | `e8a902dfa12fa9f825418721efc377161d7d7775` |
| `ipc-broker.boundary.test.mjs` | `af67f31d8d86b6bafdc6f49a34581b4e0b1001b8` |
| `ipc-hardening.test.mjs` | `a2911def7491a9ddeedc29bda04a4c4d8e49fe95` |
| `ipc-isolation.test.mjs` | `e87bf8af2a0456450e7afef22eca251a0618c871` |
| `ipc-isolation.owner.mjs` | `1d30402546c287e40bc65126da15646eeea37cd9` |
| `ipc-isolation.client.mjs` | `bf99c37af23b188f53f77d40d97fb2d3bd86a62a` |

## Ejecución real

Entorno local: Node.js `v22.16.0`, proceso de test con UID root para lanzar procesos sintéticos de UID 65533, 65534 y 65532; `node:sqlite` experimental. **Cinco ejecuciones independientes, todas exit code 0**:

```text
PASS 17 IPC broker assertions; 24 concurrent requests
PASS 9 broker SIGKILL recovery assertions
PASS 5 boundary assertions; same-UID bypass confirmed; cross-UID SQLite denial checked when root
PASS 14 socket hardening assertions
PASS 15 cross-UID IPC and SQLite isolation assertions; 12 concurrent clients
```

**Total 60 aserciones aprobadas.** Las pruebas de concurrencia ejecutaron 24 solicitudes IPC y 12 procesos clientes de UID distinto. Se verificó rechazo por cuota, persistencia y replay tras `SIGKILL`, bloqueo SQLite, permisos de socket y base, protección de symlink y archivo ordinario, directorio inseguro, socket activo ajeno y reapertura normal.

## Riesgos que siguen abiertos

- La separación por UID evita acceso directo a SQLite para el cliente distinto del propietario, pero no para root o procesos que compartan el UID del broker. La batería de frontera confirma explícitamente el bypass de mismo UID.
- La validación del UID del par mediante `SO_PEERCRED` no está implementada en Node v22.16.0; se emplean permisos Unix y credenciales sintéticas.
- El wrapper de recuperación de socket conserva una posible carrera `lstat/unlink`, aunque se usa dentro de un directorio de test controlado. El broker **no elimina** rutas preexistentes.
- No se auditaron todos los imports legacy de la aplicación ni se integró un servicio real. No hay validación exhaustiva de todos los JSON maliciosos ni resistencia a usuarios privilegiados.
- `node:sqlite` es experimental. La documentación de Node describe que un socket Unix creado por Node normalmente se elimina en un cierre limpio, pero puede persistir tras caída del proceso: https://nodejs.org/api/net.html

## Próximo paso

Aislar y probar formalmente el manejo de socket obsoleto sin carreras, explorar un IPC que permita autenticar credenciales del par, y auditar las importaciones legacy en la rama aislada. No conectar entornos reales sin autorización independiente.
