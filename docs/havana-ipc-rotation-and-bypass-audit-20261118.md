# ENLACE DIGITAL — auditoría de bypass y recuperación IPC por rotación (2026-11-18)

## Base y límites

Base autorizada `4fde3c89b6694b21a1c7d8f81714b3a22e290193`; rama `plan/havana-osrm-benchmark-offline-20261114`. La comparación inicial GitHub fue `identical`. No se usaron GitHub Actions, cuentas, claves reales, servicios externos, despliegues, Supabase, staging, producción ni pedidos.

## Auditoría de importaciones y rutas legacy

Se recuperaron **directamente de la rama aislada** los módulos conocidos:
- `idempotency-ledger.mjs`, SHA `593e7390e25499f2ad08628b7ad4cb5f3a57e8f2`: exporta `Ledger`, crea `DatabaseSync` y sus tablas `quotas/ops` independientes.
- `idempotency-norm-v2.mjs`, SHA `38499d106fe0f4ef447f1e9659f67bd22e9de6cb`: exporta `LedgerV2`, abre `DatabaseSync` y usa `quota_v2/ops_v2` independientes.
- `shared-quota.mjs`, SHA `54716ee0996a9e074a7631dc3b1765377554858f`: exporta `SharedQuota` con acceso SQLite.
- `unified-guarded.mjs`, SHA `e67b366bdc12a10361445789174b3044a6fa36ab`: importa `SharedQuota`, exporta `GuardedQuota`.
- `single-entry.mjs`, SHA `3c924e1d1d4355505e389d2596490dade1a62cc8`: importa `GuardedQuota` y expone una fachada optativa.
- `ipc-broker.mjs`, SHA `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a`: contiene la cuota unificada del broker.

**Hallazgo confirmado:** `Ledger`, `LedgerV2`, `SharedQuota` y `GuardedQuota` siguen siendo importables. La fachada y el broker no imponen una barrera de importación a código que pueda abrir SQLite directamente. La barrera efectiva ensayada previamente depende de procesos bajo UID distintos y permisos del archivo.

**Limitación de cobertura:** la herramienta de búsqueda de código GitHub consulta la rama predeterminada, no la rama aislada. Las búsquedas de `LedgerV2`, `new Ledger(`, `GuardedQuota`, `shared-quota`, `idempotency-ledger` y `createSingleEntry` devolvieron cero coincidencias; eso **no demuestra ausencia** de referencias en la rama de trabajo. No se dispone en esta ejecución de un inventario recursivo verificable de todos los archivos de la rama; por tanto **NO se certifica auditoría exhaustiva de todas las importaciones**.

## Diseño alternativo para socket obsoleto

Se creó `ipc-rotation.mjs`: cada arranque utiliza `ipc-<32 caracteres hex>.sock` aleatorio y publica `current.json` mediante escritura de un archivo temporal exclusivo (`wx`) seguida de `renameSync`. El proceso no borra sockets obsoletos, incluidos los que persisten tras `SIGKILL`. El cliente valida que el manifiesto sea archivo regular propiedad del UID actual, modo privado, tamaño acotado, nombre del socket con patrón cerrado y ruta socket real. Ante cualquier error devuelve `PENDIENTE/IPC`.

El primer test falló porque asumía erróneamente que Node dejaba el socket después de un **cierre limpio**; Node lo elimina normalmente al cerrar. Se corrigió **solo esa expectativa del test**, y se verificó por separado que el socket persiste tras `SIGKILL`.

## Hashes Git y ejecución real

Se comparó `git hash-object` local con SHA recuperado de GitHub de los **tres archivos exactos**:

| Archivo | SHA Git |
|---|---|
| `experiments/geoapify-offline/ipc-rotation.mjs` | `045538e8f4a33d8157cb3b28c9bb0288853863fe` |
| `experiments/geoapify-offline/ipc-rotation.test.mjs` | `b5c46c3b04d9d86eb9d316b192cd3eaf5d501965` |
| `experiments/geoapify-offline/ipc-rotation.kill.test.mjs` | `af0a8cb438424ea0ee04911a1ee1c0b481c6a315` |

Node.js v22.16.0, exit code 0 en ambas ejecuciones:

```text
PASS 15 rotation assertions; no stale socket unlinked
PASS 11 SIGKILL rotation and concurrency assertions; 24 requests
```

26 aserciones: validación de manifiesto, symlink rechazado, traversal rechazado, directorio inseguro rechazado, cierre normal, cambio de nombre tras reinicio, replay, persistencia tras SIGKILL, 24 solicitudes concurrentes (una nueva reserva y 23 `QUOTA`), socket obsoleto intacto. Sin llamadas a servicios.

## Credenciales del par Unix

Comprobación local exacta:
```text
Node v22.16.0 getPeerCredentials undefined getPeerCertificate undefined
```
La API pública `node:net` de esta versión no expone `SO_PEERCRED` directamente. No se implementó autenticación de UID remoto. Para ese requisito se necesitaría una interfaz nativa o un IPC alternativo evaluado por separado.

## Riesgos y pendientes importantes

1. **El manifiesto privado (`0700`) funciona en esta batería de un mismo UID, pero NO permite por sí solo que un cliente de otro UID descubra la ruta.** Se requiere canal de descubrimiento con permisos cuidadosamente separados antes de integrar el diseño con la batería cross-UID previa. No se afirma que la rotación haya superado pruebas cross-UID.
2. El prototipo no impone un bloqueo de instancia única: dos brokers del mismo UID podrían arrancar a la vez y competir por el manifiesto; aunque SQLite serialice las cuotas, la autoridad y el descubrimiento serían ambiguos.
3. No hay política de eliminación de sockets obsoletos: se acumularían tras fallos. Un proceso propietario puede retirarlos manualmente solo tras pruebas de propiedad, estado y exclusividad, fuera del camino crítico.
4. La validación del manifiesto y del socket está separada del `connect` (posible TOCTOU si un atacante controla el directorio); el directorio privado mitiga, no demuestra ausencia absoluta de carreras.
5. El broker actual aún utiliza credenciales sintéticas, no autorización productiva. La suite completa de cinco baterías del broker no se reejecutó en esta fase; el broker no se modificó.
6. No se ha verificado la ausencia de importaciones directas en toda la rama. El riesgo de bypass permanece abierto.

**Conclusión:** prototipo de rotación probado y publicado, no autorizado para integración operativa. Mantener aislamiento y límites actuales.
