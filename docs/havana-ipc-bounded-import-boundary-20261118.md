# ENLACE DIGITAL — Frontera offline de importaciones IPC (2026-11-18)

## Base, alcance y cambios
Base autorizada: `48bb54af2a8a1a9ab8d08eb90da283ce6e2ebbd7`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`; comparación inicial GitHub: `identical`. Se añadieron únicamente:
- `experiments/geoapify-offline/ipc-import-boundary.mjs`: verificador **offline de código fuente** con allowlist explícita de seis consumidores históricos de `startBroker`. Modo `legacy-harness` permite los consumidores conocidos; modo `authorized` rechaza importaciones directas incluso desde los consumidores históricos. Rechaza rutas no esperadas, symlinks, importación dinámica detectada y especificadores alternativos detectados.
- `experiments/geoapify-offline/ipc-import-boundary.test.mjs`: nueve aserciones sintéticas de compatibilidad, bypass y rutas.

**No se modificaron** `ipc-broker.mjs`, `ipc-cross-rotation.mjs`, módulos legacy ni las suites históricas. No se implementó aislamiento real del cargador Node.js ni se bloqueó la exportación `startBroker`.

## Verificación exacta de archivos
`git hash-object` local de los archivos ejecutados y SHA de GitHub `fetch_file` coinciden:
- `ipc-import-boundary.mjs`: `3c352bac84f03df2162968e0723749bf216bd803`.
- `ipc-import-boundary.test.mjs`: `b51fb7fd2fa3c97c9715a79f85a09dbbd15389bd`.
- `ipc-broker.mjs`: `fdb2a41e81ccbe59c2ea20e40d06de132abdde2a`.
- `ipc-rotation.mjs`: `045538e8f4a33d8157cb3b28c9bb0288853863fe`.
- `ipc-rotation.test.mjs`: `b5c46c3b04d9d86eb9d316b192cd3eaf5d501965`.
- `ipc-rotation.kill.test.mjs`: `af0a8cb438424ea0ee04911a1ee1c0b481c6a315`.
- `ipc-cross-rotation.mjs` (bloqueo interno): `88b5f6d04241dc813703d8962d91e20a69aa9e88`.
- `ipc-exclusive.test.mjs`: `82a2c2c1d6172b504f7fa0b7625e45106f1e773c`.
- `ipc-lock-path.test.mjs`: `f3ef8d5f47cdbbafd3ce3cd7e06dabd5efc8ea02`.
- `ipc-manifest-adversarial.test.mjs`: `a6d4878c6bbd37e9928cc0e2c4f3329933505a5a`.
- `ipc-cross.test.mjs`: `a050d14cd38ba0cb48c42be52cb204bfc36cc6f2`.

**Nota sobre compatibilidad exacta:** `ipc-cross.test.mjs` se ejecutó con la variante original `ipc-cross-rotation.mjs` (blob `e0b4d3e25ad8f72e14ca86c255912b0bd8b1b78e`) para la que fue creada, mientras `ipc-exclusive.test.mjs`, `ipc-lock-path.test.mjs` e `ipc-manifest-adversarial.test.mjs` se ejecutaron con la variante más reciente `88b5f6d...`. Las dos variantes no se mezclaron al atribuir resultados.

## Ejecución real Node.js v22.16.0
Todas las ejecuciones finalizaron con código 0 en el contenedor local Linux, con UID 0 únicamente para procesos de prueba con UID numéricos sintéticos, sin crear cuentas:
```text
PASS 9 bounded IPC import policy assertions
PASS 15 rotation assertions; no stale socket unlinked
PASS 11 SIGKILL rotation and concurrency assertions; 24 requests
PASS 17 mandatory SQLite owner lock assertions; 12 concurrent IPC calls
PASS 10 lock-path adversarial assertions
PASS 18 cross-UID rotation assertions; 12 concurrent processes
PASS 17 IPC broker assertions; 24 concurrent requests
PASS 9 broker SIGKILL recovery assertions
PASS 5 boundary assertions; same-UID bypass confirmed; cross-UID SQLite denial checked when root
PASS 14 socket hardening assertions
PASS 15 cross-UID IPC and SQLite isolation assertions; 12 concurrent clients
PASS 10 manifest adversarial assertions
```
**150 aserciones ejecutadas en 12 baterías distintas**, sin sumar la ejecución duplicada de una misma batería. Se verificaron reinicios `SIGKILL`, concurrencia, cuotas, permisos entre UID y manifiestos adversariales. La suite `ipc-cross.test.mjs` comprueba el diseño anterior, no el nuevo lock interno; el nuevo lock se comprueba por `ipc-exclusive.test.mjs`.

## Consumidores legacy y límites de cobertura
Se conocen por inspección directa seis archivos que importan `startBroker`: `ipc-broker.test.mjs`, `ipc-broker.sigkill.test.mjs`, `ipc-broker.boundary.test.mjs`, `ipc-isolation.owner.mjs`, `ipc-rotation.mjs`, `ipc-cross-rotation.mjs`. El verificador permite esos nombres únicamente en el modo legacy. **No se obtuvo ni inspeccionó un árbol recursivo completo**; el verificador requiere que un orquestador confiable suministre explícitamente los archivos por comprobar. Un archivo omitido no se audita.

El análisis estático utiliza expresiones regulares, no un parser completo de ECMAScript; no garantiza detectar todos los alias, imports computados, código generado, resolución de paquetes ni ejecución directa por otra ruta. **No es una barrera de seguridad efectiva en tiempo de ejecución** y no se ha integrado como paso obligatorio en CI ni en ningún servicio, de acuerdo con la prohibición de GitHub Actions y despliegues.

## Riesgos y siguiente decisión técnica
- `startBroker` sigue exportado y el proceso con UID propietario puede abrir SQLite directamente: bypass real demostrado por pruebas históricas.
- La exclusión de `startCrossRotation` protege solo invocaciones que comparten el mismo lock; no es global.
- `O_NOFOLLOW` más verificaciones de inodo reducen exposición, pero SQLite abre por ruta y conserva ventana TOCTOU.
- `SO_PEERCRED` no se implementó ni verificó.
- Para una frontera ejecutable robusta se necesitaría separar físicamente el módulo propietario y la base SQLite en un proceso/paquete aislado, limitar permisos y distribuir solo el cliente IPC a consumidores no privilegiados; requiere una autorización de arquitectura específica antes de integrarse en cualquier aplicación real.

Sin GitHub Actions, cuentas, claves, servicios externos, despliegues, Supabase, staging, producción ni pedidos.
