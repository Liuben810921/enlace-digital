# Reasignación selectiva de productos entre almacenes — 2026-11-19

Base b46b8722d50d56e1e1b84200bde2e54cbcc71816, comparación inicial identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Función operativa implementada
Commit 5bee66b1588b64e461ff8346e042d120ec376c2a, blob index.html 77486f038724ee21bceb8fe3231fe5f669aecf85.

edDeliveryReassignWarehouse permite seleccionar por IDs de producto separados por comas qué dependencias del almacén origen deben trasladarse al almacén destino. Una respuesta vacía selecciona todos. Rechaza IDs ajenos al origen y duplicados. La confirmación muestra el número de productos seleccionados. Solo modifica las asociaciones de productos seleccionados; las demás permanecen intactas. Conserva las validaciones previas de tipo/proveedor y de inventario sincronizado.

## Prueba focalizada
Se extrajo y ejecutó la función real con datos sintéticos:
- Selección p1: true, 1 escritura; p1 pasa a w2, p2 permanece en w1.
- Selección p1,p1: false, 0 escrituras.
- Selección invalid: false, 0 escrituras.
- Selección vacía: true, 1 escritura; p1 y p2 pasan a w2.
**4/4 escenarios esperados**. Sin navegador ni batería integral.

## Límites
La selección de productos se introduce mediante prompt con IDs, no mediante selector visual. Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE; investigación cerrada. No se desplegó ni se tocaron datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
