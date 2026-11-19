# Instantáneas de almacenes y proveedores al persistir — 2026-11-19

Base b9c7396c730343e5b8b24c7bde2c1684e4d185e9. Rama plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical (0 commits posteriores).

## Cambios
edDeliveryOriginDelete, edDeliverySupplierDelete y edDeliverySupplierEdit transmiten la instantánea original a edDeliveryPersistAndInvalidate. edDeliveryOriginSave lo hace para ediciones; las creaciones conservan el contrato de tres argumentos. El helper ya verifica expectedPrevious cuando se suministra.

## Pruebas focalizadas
Las funciones reales de index.html se ejecutaron con almacenamiento y confirmaciones sintéticas.

| Operación | Normal | Conflicto detectado en persistencia | Fallo de persistencia |
|---|---|---|---|
| Eliminar almacén | PASS: 1 persistencia | PASS: 0 | PASS: 0 |
| Eliminar proveedor | PASS: 1 persistencia | PASS: 0 | PASS: 0 |
| Editar proveedor | PASS: 1 persistencia | PASS: 0 | PASS: 0 |

Estas nueve pruebas simulan el contrato del helper desde las funciones de negocio, no escrituras reales.

Pruebas adicionales ejecutando el helper real:
- Escritura con instantánea vigente: PASS (una escritura).
- Instantánea obsoleta: PASS (rechazo, cero escrituras).
- Invalidación fallida: PASS (rollback verificado).
- Escritura parcial fallida: PASS (rollback verificado).
- Escritura parcial y rollback fallido: PASS (cuarentena activada).

Total: 14 escenarios focalizados con resultados esperados.

## Límites
No se garantiza atomicidad entre pestañas, ni se ha probado DOM real, Chromium, localStorage real o recuperación en navegador. Permanecen pendientes las operaciones de transferencia masiva de almacenes, consistencia de dependencias frente a cambios intercalados y batería integral con autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
