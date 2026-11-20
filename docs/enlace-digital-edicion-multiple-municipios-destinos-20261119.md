# Actualización múltiple de municipio en destinos — 2026-11-19

Base 4e61aa41545d453a696afa51ea089fbbab77fe63; comparación identical. Rama plan/havana-osrm-benchmark-offline-20261114.

## Nueva operación
Commit c41e550d914cd7ecb3823392432b447676769d70; index.html blob a9e64df5b7f6ecaa882dd4db64814431142c8e6c.

El panel de eliminación múltiple de destinos incorpora un selector de municipio y botón «Actualizar municipio». La función edDeliveryDestinationsMoveSelected verifica cuarentena, municipio válido según la lista de La Habana, selección única no vacía, existencia de destinos, confirmación y snapshot de la clave antes de actualizar solo los destinos seleccionados. Conserva direcciones y coordenadas existentes, con advertencia expresa de revisión manual. Una sola escritura de clave de destinos, sin modificar almacenes ni proveedores.

## Pruebas focalizadas
Función real con DOM/localStorage sintéticos:
1. Selección d1,d3: true, una escritura; ambos municipios cambiados y d2 conservado.
2. ID desconocido: false, cero escrituras.
3. Selección vacía: false, cero escrituras.
4. Municipio no permitido: false, cero escrituras.
5. Cambio de clave durante confirmación: false, cero escrituras.
6. Cuarentena: false, cero escrituras.
**6/6 resultados esperados**. Sintaxis de función y panel validada. Sin navegador ni batería integral.

## Límites
No se realiza geocodificación ni validación cartográfica automática de direcciones o coordenadas. Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE. Sin despliegue ni sistemas reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
