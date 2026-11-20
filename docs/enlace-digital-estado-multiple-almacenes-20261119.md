# Activación y desactivación múltiple de almacenes — 2026-11-19

Base e90450b191f30515bb10c4b713f3e7e56a2b3e8c, comparación identical. Rama plan/havana-osrm-benchmark-offline-20261114.

## Nueva capacidad
Commit 2025315cf4fadfa9bc9fa97f095e99b0ba4b362d; index.html blob 604828b4a7f790f013d2da7c3a4fbc1f4778be97.

En el selector múltiple de puntos de salida se añadieron botones Activar seleccionados y Desactivar seleccionados. edDeliveryOriginsSetSelectedActive(active) valida IDs, existencia, cuarentena, dependencias de productos, proveedor activo al activar y snapshots de claves de almacenes, proveedores y asociaciones antes de persistir una sola clave de almacenes. Modifica estado y versión únicamente de registros cuyo estado cambia; conserva las asociaciones.

## Pruebas focalizadas
Función real con DOM/localStorage sintéticos:
1. Activación válida de almacén de proveedor activo: true, una escritura.
2. Desactivación válida sin productos: true, una escritura.
3. Desactivación con producto asociado: false, cero escrituras.
4. Activación con proveedor inactivo: false, cero escrituras.
5. Cambio de clave de almacenes durante confirmación: false, cero escrituras.
**5/5 resultados esperados**. Sintaxis de función y panel validada. Sin navegador ni batería integral.

## Límites
La comparación local no asegura atomicidad entre pestañas. Persistencia compartida insegura: PENDIENTE. Sin despliegue ni datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
