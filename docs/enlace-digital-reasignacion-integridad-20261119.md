# Reasignación de almacenes: integridad de asociaciones — 2026-11-19

Base b42556e6b7304f4ed7c0cbb2bf924d97c20320db; rama plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Cambio operativo
Commit fd6e4dc166ecc03aba07bf74d4ddba70a6d3087d; index.html blob d07014bb2ee50ee28bb55d9eceb4186bb95b171c.

La función real edDeliveryReassignWarehouse valida antes de confirmar que cada asociación afectada corresponde a un producto existente, que su origen_producto coincide con el tipo del almacén, que no hay guardados de inventario pendientes y que el inventario local coincide con el snapshot y la copia compartida. Después de la confirmación revalida el snapshot compartido antes de persistir la nueva asociación.

## Verificación focalizada
La función real modificada fue extraída y ejecutada en JS aislado con DOM, localStorage y dependencias simulados:
1. Producto con tipo incompatible: false, 0 escrituras.
2. Inventario compartido cambia durante confirmación: false, 0 escrituras.
3. Producto compatible e inventario estable: true, 1 escritura.
**3/3 escenarios esperados.** No se ejecutó navegador ni batería integral.

## Limitaciones
La comprobación previa a escritura no constituye transacción atómica entre pestañas. Persistencia compartida insegura y recuperación remota: PENDIENTE, investigación cerrada. No se modificaron otros flujos ni se desplegó el cambio.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
