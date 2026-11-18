# ENLACE DIGITAL — Git blobs exactos, SIGKILL e invariantes SQLite (2026-11-18)

**Base autorizada:** `f32be5c31ef12ce8f36beebae585c31beb436a39`. **Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`. Al iniciar, comparación GitHub base/HEAD: `identical`. Solo archivos sintéticos offline.

## Bloqueo de hashes resuelto

Se recuperaron con el conector GitHub los dos archivos de pruebas originales. Se reconstruyeron en `/mnt/data/ed-guarded-exact/` y `git hash-object` coincidió **exactamente** con los SHA de blobs GitHub:

| Archivo | Blob Git SHA-1 |
|---|---|
| `unified-guarded.faults.test.mjs` | `d83865b94ea929e3201ac2a75a2bb67439c582ae` |
| `unified-guarded.collision.test.mjs` | `a94cb296785bbf2d3ac32c1be7abcfd379a8618d` |
| `unified-guarded.sigkill.test.mjs` (nuevo) | `4203713b56014b0a0407726e799dfe42691a28f7` |
| `unified-guarded.mjs` (sin cambios) | `e67b366bdc12a10361445789174b3044a6fa36ab` |

El archivo nuevo de SIGKILL se publicó en commit `abafd20d8ccd1dd5d38fc4f8f2c65fb9c5615903`, se recuperó su SHA GitHub y se ajustó la copia local hasta lograr coincidencia exacta antes de ejecutarla. Las dependencias `shared-quota.mjs` e `idempotency-norm-v2.mjs` se verificaron previamente como blobs exactos en la misma carpeta.

## Ejecución real

Entorno: Node.js `v22.16.0`, módulo experimental `node:sqlite`, sin redes, cuentas ni servicios. Los tres procesos de prueba terminaron con **exit code 0**:

```text
PASS 12 guarded crash and identity assertions
PASS 3 global-collision assertions; 24 processes, one reservation
PASS 23 SIGKILL and SQLite invariant assertions; 4 SIGKILL barriers
```

**Total: 38 aserciones aprobadas sobre copias byte a byte verificadas de archivos GitHub.**

## SIGKILL y auditoría

La nueva batería lanza un proceso hijo Node, espera el marcador `READY` emitido después de la acción y envía `SIGKILL`; comprueba señal de terminación, reapertura y estado SQLite:
1. `SIGKILL` con `BEGIN IMMEDIATE` y una inserción no confirmada: el registro de prueba no persiste.
2. `SIGKILL` con modificación no confirmada de cuota y operación: ambas modificaciones revierten; reserva original persiste.
3. `SIGKILL` después de `finish()` confirmado: consumo persistente y segundo `finish()` devuelve `REPLAY`.
4. `SIGKILL` después de `start()` confirmado: reserva persiste; segundo `start()` devuelve `ALREADY_TRACKED`.

La auditoría compara `shared_credits.used` con `CONSUMED + UNKNOWN_CONSUMED`, `shared_credits.reserved` con `RESERVED`, exige `used>=0`, `reserved>=0`, `used+reserved<=limit` y comprueba `PRAGMA integrity_check = ok` tras cada reapertura. El escenario multiproceso previo utiliza 24 procesos con el mismo ID global y versiones/identidades sintéticas diferentes: exactamente una reserva.

## Límites / NO-GO

- La señal se envía tras un marcador de barrera; no es una exploración exhaustiva de cada instrucción, ni simula pérdida de energía, corrupción de disco, llamada a proveedor o caída del host.
- `SIGKILL` justo después de `COMMIT` prueba recuperación del estado persistido, no la incertidumbre de una llamada externa.
- El coordinador protegido sigue siendo un **prototipo alternativo**, no intercepta los registros antiguos; por tanto no garantiza que toda ruta use la misma cuota.
- `principal` es sintético y aportado por el llamador, **no autenticación real**.
- No se modificó `unified-guarded.mjs` porque ninguna prueba reprodujo un defecto.
- No se ejecutaron GitHub Actions, ni se usaron cuentas, claves, servicios, despliegues, Supabase, staging, producción, clientes ni pedidos.

## Próxima fase segura

Evaluar un único punto de entrada que impida saltarse el coordinador y diseñar autenticación/autoridad del principal sin activación externa; probar transiciones de día, corrupción sintética y bloqueo SQLite, todo offline.
