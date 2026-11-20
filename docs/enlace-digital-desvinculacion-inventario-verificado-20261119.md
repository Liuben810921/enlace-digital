# Desvinculación selectiva: verificación de inventario — 2026-11-19

Base 5a4421ccf16b6868871948e7604ba076c7613189; comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto y corrección
La función edDeliveryUnlinkWarehouseProducts aceptaba asociaciones de productos huérfanos o incompatibles y no verificaba la sincronización del inventario, a diferencia de la reasignación. Commit 8f802622ab3fac9eab5f9de7d6dd98dbbb82a19e; index.html blob 8caaf1dda00cde14f2cb1dcebd9b2010584061a8.

Ahora comprueba inventario cargado y sin guardados pendientes, snapshot local y compartido coincidentes, unicidad de IDs, existencia de los productos afectados y compatibilidad de origen. Tras confirmar vuelve a verificar la versión del inventario antes de persistir solo la clave de asociaciones.

## Pruebas focalizadas
Función real con DOM/localStorage/inventario sintéticos:
1. Desvincular p1 de w1 conservando w2: true, una escritura.
2. Producto de tipo incompatible: false, cero escrituras.
3. Guardado de inventario pendiente: false, cero escrituras.
4. Inventario compartido modificado durante confirmación: false, cero escrituras.
**4/4 resultados esperados**. Sintaxis validada. Sin navegador ni batería integral.

## Límites
Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE. No se realizaron operaciones reales ni despliegues.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
