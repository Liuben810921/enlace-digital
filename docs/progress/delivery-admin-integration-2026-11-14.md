# Integración del panel de entregas — 14 noviembre 2026

## Estado comprobado
- GitHub Actions #43630788413: **success** para commit 42187f7.
- Modificado `index.html` **solo en rama aislada**, sin desplegar: edición de nombre de proveedor, activación/desactivación, filtrado de proveedores inactivos en selector y validación al guardar almacenes.
- Al guardar almacenes se incrementa `version` local; la revisión de contexto local se incrementa al añadir/editar/desactivar proveedor, guardar/activar/desactivar almacén y cambiar asociación producto-origen.
- `edDeliveryQuoteSnapshot()` / `edDeliveryQuoteStillValid()` modelan invalidación **solo en navegador**. Su estado `pending_verified_road_distance` no representa tarifa aprobada ni distancia vial.
- Nueva regresión `tests/delivery-admin-context-invalidation.test.cjs` verifica edición de proveedor, coordenadas reales confirmadas del almacén del proveedor, versiones, cambios de ubicación y estado e invalidación de snapshot.
- Workflow CI actualizado para ejecutar la regresión. **La ejecución nueva debe verificarse antes de declarar PASS.**

## Límites
- No hay control transaccional entre pestañas, ni cotización firmada por servidor, ni almacenamiento persistente seguro de almacenes. La invalidación local no sustituye una validación backend.
- No se introdujo nombre comercial definitivo ni domicilio privado.
- La tienda pública y Supabase no se tocaron. No se activaron pedidos reales, correo, pagos ni servicios de rutas.
- Los productos con varios orígenes siguen necesitando selección efectiva y distancias viales verificadas antes de calcular un importe real.
