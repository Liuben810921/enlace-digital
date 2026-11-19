# Versionado local de inventario en transferencias — 2026-11-19

Base 5bcd9a2cfeb0b04347313cfa67f68474e0e34eaa. Rama plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical.

## Hallazgo
La transferencia comprobaba IDs y origen_producto del estado en memoria, pero no exigía que el estado coincidiera con edInventorySnapshot ni que la generación de carga permaneciera igual. Una edición local no sincronizada u otra recarga podían dejar la validación desfasada.

## Corrección
edDeliverySupplierTransferWarehouses rechaza al inicio si JSON.stringify(state.products)!==edInventorySnapshot. Guarda generación edInventoryLoadGeneration y versión edInventorySnapshot antes de la confirmación y verifica ambas, junto con la instantánea de productos, inmediatamente antes de persistir.

## Pruebas sintéticas focalizadas
Funciones reales de transferencia y persistencia extraídas de index.html, almacenamiento ficticio:
- válida: true, 1 escritura;
- instantánea obsoleta al iniciar: false, 0;
- cambio de instantánea durante confirmación: false, 0;
- cambio de generación durante confirmación: false, 0;
- cambio de origen_producto durante confirmación: false, 0;
- inventario no cargado: false, 0.

6/6 resultados esperados.

## Límites y diseño futuro
edInventorySnapshot es una versión local, no una revisión remota autorizada. La comprobación no detecta cambios remotos después de sincronizar. Para garantías transaccionales entre usuarios se requeriría versión monotónica del catálogo validada por el servidor durante la transferencia, idealmente mediante una operación condicional atómica. No se implementó ni se consultó Supabase. El cambio puede bloquear transferencias mientras existan ediciones locales pendientes, intencionalmente fail-closed. No se ejecutó navegador ni batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
