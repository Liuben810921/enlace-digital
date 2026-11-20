# Actualización múltiple de municipio en almacenes — 2026-11-19

Base 79fe01e7c3984a0d68ef1bd4c93ff0a4f7eb1775, comparación identical. Rama plan/havana-osrm-benchmark-offline-20261114.

## Capacidad
Commit 23df7603fb6b82b7625c55fd9ec34ee3437ed4bb; index.html blob 625fad60cd3a699c0cc14dd8e23829d3cb45bc62.

El panel de puntos de salida incorpora selección múltiple de almacenes y selector de municipio. edDeliveryOriginsMoveSelected verifica cuarentena, municipio de la lista de La Habana, IDs seleccionados únicos y existentes, confirmación y snapshot de la clave de almacenes. Modifica únicamente municipio y versión de los almacenes seleccionados; conserva proveedor, tipo, dirección, coordenadas, estado y asociaciones. Usa edDeliveryPersistAndInvalidate con razón warehouses_bulk_municipality, sin escritura coordinada de varias claves. La confirmación advierte que direcciones, coordenadas y cotizaciones requieren revisión.

## Pruebas focalizadas
Función real con DOM/localStorage sintéticos:
1. w1 y w3 actualizados: true, una escritura, versiones 2→3 y 1→2; w2 conserva versión 4.
2. Almacén inexistente: false, cero escrituras.
3. Selección vacía: false, cero escrituras.
4. Municipio inválido: false, cero escrituras.
5. Cambio de clave durante confirmación: false, cero escrituras.
6. Cuarentena: false, cero escrituras.
**6/6 resultados esperados**. Sintaxis de función y panel validada. Sin navegador ni batería integral.

## Límites
No se verifican automáticamente direcciones o coordenadas, ni se calculan rutas. Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE. No se realizaron despliegues ni operaciones reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
