# Prueba integrada de cola de inventario y transferencia — 2026-11-19

Base 5acea2d7cddd60fd8f6dd191249cc63ea4be2ebd; rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Método
Se extrajeron las funciones reales edQueueInventory, edDeliverySupplierTransferWarehouses y edDeliveryPersistAndInvalidate del index.html de la rama. Se ejecutaron juntas con estado, localStorage, API y confirmaciones ficticios; sin servicios remotos.

## Escenarios y resultados
- Dos productos; primera escritura API ficticia exitosa y segunda pendiente: edInventoryPendingSaves=1, transferencia false, almacén conserva proveedor s1.
- Se resuelve la segunda escritura con error: edInventoryPendingSaves=0, edInventorySnapshot='[]', transferencia false por desincronización.
- Reintento sin fallo: llamadas de productos [1,2,1,2], contador=0, transferencia true, almacén pasa de s1 a s2.

La protección impide transferir durante guardados pendientes y después de fallo parcial. No se reprodujo defecto nuevo; no se modificó código funcional.

## Límites
La prueba cubre una sola sesión JavaScript y confirmaciones síncronas. No demuestra atomicidad remota, ausencia de carreras entre pestañas ni recuperación de fallos de invalidación. No se ejecutó navegador ni batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
