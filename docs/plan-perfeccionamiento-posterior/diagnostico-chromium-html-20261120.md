# Diagnóstico focalizado HTML exacto y Chromium — 2026-11-20

Base `ca5038bf84e411e1ec90da25c8a23549af28e8a4`; comparación inicial de rama `identical`. No cambios operativos.

## HTML

El conector GitHub recuperó `index.html` en rama `plan/havana-osrm-benchmark-offline-20261114`, blob SHA `e03883314869a1c2a24a486696d5199cbdb1caa5`, longitud de texto 418485 caracteres. La recuperación se produjo en el entorno del conector, **no en el sistema de archivos del navegador aislado**. No se obtuvo copia local exacta y por tanto no se ejecutó el checkout real.

## Chromium

Se comprobó `/usr/bin/chromium` y Node.js `v22.16.0`. Prueba de humo sobre `about:blank` (no sobre la web):

```
timeout 8s chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-background-networking --dump-dom about:blank
```

Resultado observado: errores de conexión D-Bus del contenedor, proceso terminado por `timeout` (código 124). **Ni siquiera la página vacía completó**; esto aísla el bloqueo en el entorno de ejecución, no demuestra defecto en ENLACE DIGITAL. No se intentó eludir restricciones del contenedor.

## Estado

- Materialización exacta local: BLOQUEADA.
- Chromium headless: BLOQUEADO en prueba de humo.
- Prueba móvil dinámica del checkout real: NO EJECUTADA.
- `PENDIENTE` y ausencia de tarifas: garantizados solo por diseño/código previo y pruebas unitarias offline; **no verificados en DOM móvil**.
- Defectos reproducidos en producto: NINGUNO.

## Próximo paso

Utilizar un entorno aislado que permita obtener los bytes exactos del archivo GitHub y ejecutar Chromium funcional, sin red hacia servicios reales; comprobar SHA/blob y después ejecutar pruebas DOM con datos sintéticos. No reconstruir la página ni presentar el timeout como fallo del producto. Conservar el estado PENDIENTE y prohibición de tarifas reales.

Sin Geoapify, claves, GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos. Persistencia compartida insegura y atomicidad entre pestañas siguen PENDIENTES.
