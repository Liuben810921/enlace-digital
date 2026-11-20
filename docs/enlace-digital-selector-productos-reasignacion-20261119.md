# Selección visual de productos para reasignación — 2026-11-19

Base 91fe4ef3b81ae66a5daa2ecc9acc78a5f4ea19e1; rama plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical.

## Cambio operativo
Commit 695b337f06ade2981a6ef6d0746bb4f70688c617; index.html blob 465f0a286517b5a3e87da4602b712ac382cc2220.

edDeliveryOriginsPanel muestra, por cada almacén con asociaciones, un fieldset de casillas marcadas inicialmente para los productos asociados; usa nombre de producto si está disponible y muestra su ID. edDeliveryReassignWarehouse lee la selección de casillas y elimina el prompt de IDs. Mantiene la selección del almacén de destino mediante select y las validaciones previas de compatibilidad, dependencias e inventario.

## Verificación focalizada
Función real ejecutada con DOM y localStorage sintéticos:
1. p1 seleccionado: true, una escritura, p1 pasa a w2 y p2 permanece en w1.
2. Selección vacía: false, cero escrituras.
3. Producto no asociado: false, cero escrituras.
4. p1 y p2 seleccionados: true, una escritura, ambos pasan a w2.
**4/4 escenarios esperados**. Sintaxis de las dos funciones modificadas validada. No se ejecutó navegador ni batería integral.

## Limitaciones
Sin prueba visual de los controles. Persistencia compartida insegura y operaciones que requieren atomicidad entre pestañas: PENDIENTE, sin reabrir investigación. No hubo despliegues ni acceso a datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
