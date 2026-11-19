# Transferencias y asociaciones: persistencia focalizada — 2026-11-19

Base bf8bbb99c2ef606839c2b36ed295a0cc82a036af. Rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical; sin commits posteriores.

## Cambios
1. edDeliverySupplierTransferWarehouses pasa rawOrigins a edDeliveryPersistAndInvalidate, que verifica la instantánea original justo antes de escribir.
2. edDeliveryReassignWarehouse y edDeliveryUnlinkWarehouseProducts usan ahora edDeliveryPersistAndInvalidate con la instantánea de asociaciones. Sustituyen los bloques propios de setItem, readback, invalidación y rollback por la ruta compartida verificada. Se conservan las comprobaciones de almacenes, proveedores, inventario y dependencias anteriores a la escritura.

## Pruebas sintéticas focalizadas
Se ejecutaron funciones reales extraídas de index.html con dependencias simuladas (localStorage, confirmaciones, DOM, proveedores y almacenes ficticios).

| Operación | Normal | Conflicto en persistencia | Fallo de persistencia |
|---|---|---|---|
| Transferir almacenes entre proveedores | PASS, una persistencia | PASS, cero persistencias | PASS, cero persistencias |
| Reasignar productos entre almacenes compatibles | PASS, una persistencia | PASS, cero persistencias | PASS, cero persistencias |
| Desvincular productos de un almacén | PASS, una persistencia | PASS, cero persistencias | PASS, cero persistencias |

9/9 escenarios con resultado esperado. La persistencia fue simulada mediante un doble que exige coincidencia con la instantánea; no son pruebas de escritura real ni ejecutan el helper compartido en estos nueve casos. La recuperación del helper real se verificó en etapas anteriores y no se repitió aquí.

## Riesgos y pendientes
- No existe atomicidad garantizada entre pestañas en localStorage.
- La relectura y comparación de dependencias previa al guardado no es una transacción multi-clave.
- Pendientes: escenarios específicos de JSON corrupto y almacenes incompatibles en estas operaciones, integración con helper real ante fallos de invalidación y rollback, pruebas móviles reales y batería integral previa autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
