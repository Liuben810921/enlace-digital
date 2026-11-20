# Desactivación de proveedores con dependencias — 2026-11-19

Base e49f9d2604c80b2db633b30294b426fe437d51d8; comparación inicial identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto y cambio
edDeliverySupplierToggle permitía desactivar un proveedor con productos asociados a sus almacenes tras una confirmación, dejando los productos con proveedor no operativo. Commit 8d4b7791dfbaf617d0660aba842072fff72aaace; index.html blob 03dd2749a4d6d8974794ffd7c8966552a8a52e67.

La desactivación ahora verifica asociaciones almacenadas, rechaza productos dependientes con indicación de reasignar o desvincular, permite desactivar proveedores con almacenes sin productos tras confirmación, y compara snapshots de almacenes y asociaciones antes de persistir el estado del proveedor. La activación continúa disponible. Escritura exclusiva en clave de proveedores.

## Verificación focalizada
Función real con almacenamiento y dependencias sintéticos:
1. Proveedor con p1 asociado a w1: false, cero escrituras.
2. Proveedor con almacén sin productos: true, una escritura, inactivo.
3. Reactivación: true, una escritura, activo.
4. Asociaciones cambiadas durante la comprobación: false, cero escrituras.
**4/4 escenarios esperados**. Sintaxis validada. Sin navegador ni batería integral.

## Límites
No hay atomicidad garantizada entre pestañas. Persistencia compartida insegura y operaciones que la requieran: PENDIENTE. Sin despliegue ni datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
