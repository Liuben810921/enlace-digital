# ENLACE DIGITAL — Coherencia del origen del producto con sus almacenes
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base `360570540cf55182ab77fd3de5699f628c7e883f`; HEAD inicial idéntico, sin commits posteriores.

## Defecto funcional
La función `edProductOriginsSave` comprobaba que los almacenes seleccionados compartieran tipo y proveedor, pero no que ese tipo coincidiera con `origen_producto` del producto. Un producto declarado de proveedor podía guardar una asociación de almacén propio si se le suministraba esa selección.

## Corrección
`edProductOriginsSave(productId,ids,expectedType)` valida ahora el tipo de cada almacén contra el origen del producto. Las llamadas desde alta y edición pasan respectivamente `origin` y `p.origen_producto`. La lista vacía mantiene el comportamiento previo, sin inventar un almacén.

## Pruebas focalizadas
Fuente exacta `index.html`, blob `5678ff91081ce59ea27a673c7a8189f5053f606d`.
- Producto proveedor + almacén propio: rechazo sin persistir — **PASS**.
- Producto propio + almacén propio: guardado — **PASS**.
- Producto proveedor + almacén proveedor: guardado — **PASS**.
- Sin almacenes seleccionados: guardado de lista vacía — **PASS**.
- Ambas rutas de alta y edición pasan el tipo esperado — **PASS**.
- Sintaxis completa del JavaScript inline — **PASS**.

Las comprobaciones se ejecutaron sobre la función real extraída del código, con datos ficticios y almacenamiento simulado. No equivalen a pruebas Chromium, integración ni a batería integral. Cotizaciones viales no verificadas permanecen `PENDIENTE`. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
