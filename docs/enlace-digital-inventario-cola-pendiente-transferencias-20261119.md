# Guardado de inventario pendiente y transferencias — 2026-11-19

Base 4517cccbf711d137a941246cd8550863168d97d1; rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Hallazgo
edQueueInventory crea un lote de guardado asíncrono, pero la transferencia solo comparaba state.products con edInventorySnapshot. Si el lote pendiente era un guardado sin cambios de productos, ambas copias coincidían y la transferencia podía continuar mientras el guardado remoto todavía no había terminado. Es una carrera local reproducible mediante contador de lote pendiente.

## Corrección
Se añadió edInventoryPendingSaves. El contador incrementa al encolar y decrementa en finally tras éxito o fallo; la transferencia rechaza operaciones si el contador es mayor que cero, antes y después de confirmación. No se alteró la API ni se activaron servicios.

## Pruebas focalizadas
Funciones reales edDeliverySupplierTransferWarehouses y edDeliveryPersistAndInvalidate con almacenamiento ficticio y snapshots iguales:
- 0 lotes pendientes: transferencia válida, 1 escritura;
- 1 lote pendiente: transferencia rechazada, 0 escrituras;
- 2 lotes pendientes: transferencia rechazada, 0 escrituras.

3/3 resultados esperados. La cola real de guardado y el decremento en finally se inspeccionaron en el código, pero no se ejecutaron sintéticamente de extremo a extremo en esta etapa.

## Límites
No existe una versión transaccional remota para validar cambios entre usuarios; edInventorySnapshot sigue siendo una instantánea local. Una cola de guardado fallida deja los cambios locales desincronizados y la transferencia permanece bloqueada por comparación de snapshots, comportamiento fail-closed. Pendiente: prueba sintética completa de la cola con fallo y recuperación, y comprobar normalización de imágenes durante el guardado.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
