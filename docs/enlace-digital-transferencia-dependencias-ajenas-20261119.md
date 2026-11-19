# Transferencias: asociaciones ajenas corruptas y recuperación — 2026-11-19

Base 13e80db086cd6d6ce003d4e9fe507be1a216ced8. Rama plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical (cero commits posteriores).

## Defectos reproducidos
La función real edDeliverySupplierTransferWarehouses permitía persistir transferencias si existían asociaciones ajenas con IDs duplicados, almacenes inexistentes o mezcla incompatible de tipos/proveedores. Tres escenarios reproducidos con una escritura cada uno.

## Corrección
Validación fail-closed del mapa completo antes de transferir: arrays de strings sin duplicados, almacenes existentes y activos, homogeneidad de tipo y, para proveedor, coincidencia de supplierId. Se mantiene el bloqueo si hay asociaciones con almacenes transferidos y la comparación de instantáneas.

## Pruebas posteriores
Se ejecutaron edDeliverySupplierTransferWarehouses y edDeliveryPersistAndInvalidate reales juntos con almacenamiento y confirmaciones ficticios:

| Escenario | Resultado |
|---|---|
| Transferencia sin asociaciones | PASS: 1 escritura |
| Duplicados en asociación ajena | PASS: 0 escrituras |
| Almacén inexistente en asociación ajena | PASS: 0 |
| Tipos/proveedores incompatibles en asociación ajena | PASS: 0 |
| JSON corrupto | PASS: 0 |
| Producto asociado a almacén afectado | PASS: 0 |
| Fallo de invalidación | PASS: rollback, 2 escrituras |
| Fallo de rollback | PASS: cuarentena activada |
| Asociación modificada durante confirmación | PASS: 0 escrituras |

9/9 escenarios de regresión con resultados esperados; tres defectos exploratorios reproducidos antes del arreglo. No se realizaron pruebas de navegador ni almacenamiento real.

## Pendientes
No hay atomicidad multi-clave ni entre pestañas en localStorage. Pendientes: inventario incompleto y productos desconocidos en asociaciones de transferencia, verificación de coherencia con origen_producto, fallos de cuarentena persistente, Chromium móvil y batería integral con autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
