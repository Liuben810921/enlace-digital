# Eliminación referencial segura: pruebas sintéticas focalizadas — 2026-11-19

Rama: plan/havana-osrm-benchmark-offline-20261114. Base inicial 6f54eeb7d2889590579342f8f9950ce4599329cd, comparada con HEAD: identical, sin commits posteriores.

## Correcciones implementadas
- Eliminación de almacén: lectura estricta de asociaciones JSON, rechazo de datos ilegibles, formas incorrectas o elementos no textuales; no interpretar almacenamiento corrupto como ausencia de productos.
- Eliminación de almacén: comparación de instantánea de asociaciones tras confirmación para cancelar cambios detectados.
- Eliminación de proveedor: comparación de instantánea de almacenes tras confirmación para cancelar cambios detectados.
- Se conserva la prohibición existente de borrar proveedores con almacenes y almacenes con productos asociados.
- La recuperación de cuarentena acepta listas vacías de asociaciones como representación válida de productos desvinculados (se aclaró el comentario del código, sin cambiar la lógica).

## Ejecución sintética
Se extrajeron las funciones reales de index.html y se ejecutaron con dobles JavaScript de almacenamiento y confirmación, sin datos reales:
| Función | Caso | Resultado | Escrituras simuladas |
|---|---|---|---|
| edDeliveryOriginDelete | Sin productos asociados | PASS, true | 1 |
| edDeliveryOriginDelete | Asociaciones cambian durante confirmación | PASS, false | 0 |
| edDeliverySupplierDelete | Sin almacenes asociados | PASS, true | 1 |
| edDeliverySupplierDelete | Almacenes cambian durante confirmación | PASS, false | 0 |

4/4 pruebas focalizadas ejecutadas PASS para la versión anterior al endurecimiento de JSON; el endurecimiento adicional fue verificado por inspección de código, pero no reejecutado en este arnés. No atribuir a estas pruebas cobertura de persistencia real, navegador móvil, transacciones entre pestañas o recuperación real de almacenamiento.

## Pendiente
- Pruebas sintéticas específicas de corrupción JSON en eliminación de almacén y errores de persistencia en eliminaciones.
- Revisión y pruebas de destinos y edición de dependencias.
- Batería integral solo tras autorización específica.

Restricciones respetadas: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
