# Continuidad de eliminaciones seguras — 2026-11-19

Base inicial: 6f54eeb7d2889590579342f8f9950ce4599329cd. Rama aislada plan/havana-osrm-benchmark-offline-20261114. Se conservó el commit posterior de documentación creado durante la operación.

## Cambios
- edDeliveryOriginDelete rechaza asociaciones corruptas y vuelve a comparar tanto asociaciones como almacenes antes de borrar.
- edDeliverySupplierDelete vuelve a comparar almacenes y proveedores antes de borrar.
- edDeliveryDestinationDelete vuelve a comparar destinos antes de borrar.
- Las comprobaciones son instantáneas de almacenamiento local, no transacciones atómicas multiadministrador.

## Ejecución sintética focalizada
Se extrajeron las funciones reales de index.html y se ejecutaron con dobles JavaScript de lectura, confirmación y persistencia.

| Operación | Normal | Cambio del registro propio durante confirmación | Cambio de dependencia durante confirmación |
|---|---|---|---|
| Eliminar almacén | PASS, 1 escritura | PASS, bloquea, 0 | PASS, asociaciones cambiadas, bloquea, 0 |
| Eliminar proveedor | PASS, 1 escritura | PASS, bloquea, 0 | PASS, almacenes cambiados, bloquea, 0 |
| Eliminar destino | PASS, 1 escritura | PASS, bloquea, 0 | No aplica: no se modeló dependencia de almacenes |

Adicionalmente, almacén con JSON de asociaciones corrupto: PASS, bloquea, 0 escrituras. Se ejecutaron 12 invocaciones; 10 casos relevantes con resultado esperado. En las otras dos invocaciones se introdujo una corrupción ajena a la operación (asociaciones al eliminar proveedor y al eliminar destino), por lo que el resultado de éxito no se interpreta como prueba de protección referencial.

## Pendiente
Persistencia real, navegador móvil, validación de operaciones de edición, errores de escritura en eliminación, carreras entre pestañas y batería integral (solo con autorización específica). Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
