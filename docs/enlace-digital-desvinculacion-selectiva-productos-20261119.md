# Desvinculación selectiva de productos — 2026-11-19

Base 3ff46a8ee27e2a62b3c9f7b36ef49cc360a9da16, comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto reproducido y corrección
El panel edDeliveryOriginsPanel ya presentaba casillas para seleccionar productos al reasignarlos, pero edDeliveryUnlinkWarehouseProducts ignoraba esa selección y desvinculaba todos los productos del almacén. Commit bc8dc49c019bfd07dbd2cd9d178d6ad4ff7b7b59, blob index.html 3be33cf4b7556309a4169c8115d255cc347ffb33.

Ahora edDeliveryUnlinkWarehouseProducts lee las casillas seleccionadas, comprueba que sean únicas y correspondan a productos asociados al almacén, muestra en la confirmación el número seleccionado y modifica exclusivamente esas asociaciones. Se mantienen las verificaciones previas de cambios en las claves de asociaciones, almacenes y proveedores.

## Verificación focalizada
Función real ejecutada con DOM/localStorage sintéticos:
1. p1 seleccionado: true, una escritura, p1 pierde w1 pero conserva w2; p2 permanece asociado a w1.
2. Selección vacía: false, cero escrituras.
3. ID ajeno: false, cero escrituras.
4. p1 y p2 seleccionados: true, una escritura, p1 conserva w2 y p2 queda sin almacén.
**4/4 escenarios esperados.** Sintaxis validada. Sin navegador ni batería integral.

## Límites
Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE, sin reabrir investigación. No se tocaron datos reales ni se desplegó.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
