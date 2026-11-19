# ENLACE DIGITAL — Consistencia de almacenes asociados a productos
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `139a0967b0edaccdec5a3e8001d3e049a4d1f4b6`; HEAD inicial idéntico.

## Defecto reproducido
`edProductOriginsSave` validaba actividad y proveedor habilitado de cada almacén por separado, pero aceptaba asociaciones heterogéneas: un mismo producto podía guardarse con almacén propio y almacén de proveedor a la vez. La función original, ejecutada con datos ficticios, devolvió `true` y almacenó `["own-1","supplier-1"]`.

## Corrección
Se verifica que todos los almacenes seleccionados sean del mismo tipo; si son de proveedor, que todos correspondan al mismo `supplierId`. Se mantiene el comportamiento de lista vacía y los controles de actividad, revisión de cotización y cuarentena existentes. El cambio es local y no altera inventario real ni pedidos.

## Pruebas focalizadas
Archivo `index.html` recuperado desde GitHub, blob `2d5ca743f04183db306c6b842cbd22f3cfc45270`.
- Almacén propio + almacén de proveedor: rechazado sin guardar — **PASS**.
- Dos proveedores diferentes: rechazado sin guardar — **PASS**.
- Dos almacenes del mismo proveedor: guardado — **PASS**.
- Dos almacenes propios: guardado — **PASS**.
- Lista vacía: guardado — **PASS**.
- Sintaxis del script inline, parser V8 — **PASS**.

Pruebas funcionales aisladas con datos ficticios y almacenamiento simulado. No se ejecutaron pruebas Chromium móvil ni batería integral. Rutas sin distancia vial verificada siguen en `PENDIENTE`. No se usaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni servicios de pago.
