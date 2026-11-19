# ENLACE DIGITAL — Confirmación de asociaciones al editar productos
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `7fdd0bb14ed304c3085ac48fd4fcd71e222522fd`; comparación inicial identical.

## Defecto funcional
En `saveEditedProduct`, la operación `edProductOriginsSave(id,edOriginIds)` devolvía `false` ante fallo de persistencia o validación de asociaciones, pero su resultado se ignoraba y el formulario se cerraba como si todo estuviera confirmado. Esto impedía al administrador revisar el error antes de abandonar la edición.

## Corrección
Se comprueba el resultado de `edProductOriginsSave`. Si falla, se lanza un error gestionado por el `catch` ya existente, se conserva abierto el formulario y se muestra un mensaje preciso: el producto puede haberse guardado, pero sus almacenes asociados no quedaron confirmados. Si la operación devuelve true, se conserva el cierre normal. **No se declara transaccional el guardado del producto y sus asociaciones.**

## Verificación focalizada
Archivo `index.html` obtenido de GitHub, blob `85c5d52d04de0c2713ca5758c8c6805d49524146`.
- Se ejecutó el bloque real `try/catch` de guardado editado con dependencias simuladas y `edProductOriginsSave=false`: modal abierto, sin render de éxito, alerta explicativa — **PASS**.
- Con `edProductOriginsSave=true`: render y cierre normales, sin alerta — **PASS**.
- Parser V8 del script inline completo — **PASS**.

Pruebas de flujo aislado, no de integración real ni Chromium móvil. No se tocaron servicios externos ni inventario real. Las rutas viales sin verificar continúan en `PENDIENTE`. Batería integral reservada para la fase final con autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
