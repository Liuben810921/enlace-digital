# Eliminación selectiva múltiple de destinos — 2026-11-19

Base a409679aadc633f40363aa07c3bbca99fdee2c93; comparación identical. Rama plan/havana-osrm-benchmark-offline-20261114.

## Capacidad
Commit 46bdbd41e92832429b4b8d502ba3beeaad290e5f; index.html blob ad91faeeb7b76e34f7c34720b12961463921ef8d.

El panel de ubicaciones incorpora casillas para los destinos y un botón «Eliminar destinos seleccionados». edDeliveryDestinationsDeleteSelected valida selección no vacía y única, existencia de los destinos, cuarentena, confirmación explícita y snapshot de la clave de destinos antes de persistir la lista filtrada. No altera almacenes ni proveedores. Se conserva la eliminación individual.

## Pruebas focalizadas
Función real con panel/localStorage sintéticos:
1. Seleccionar d1 y d3 de d1,d2,d3: true, una escritura, permanece d2.
2. ID inexistente: false, cero escrituras.
3. Selección vacía: false, cero escrituras.
4. Cambio de clave durante confirmación: false, cero escrituras.
5. Cuarentena: false, cero escrituras.
**5/5 esperados**. Sintaxis de panel y función validada. No navegador ni batería integral.

## Límites
La operación afecta una sola clave y no asegura atomicidad entre pestañas. Persistencia compartida insegura: PENDIENTE. No se realizó despliegue ni acceso a datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
