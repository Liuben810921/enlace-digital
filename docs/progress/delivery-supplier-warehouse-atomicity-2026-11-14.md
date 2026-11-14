# Consistencia de proveedores y almacenes: invalidación local — 14 noviembre 2026

## CI previa
[#43633622571](https://github.com/Liuben810921/enlace-digital/actions/runs/43633622571) **success**: recuperación explícita, aviso móvil, cuarentena e invalidación.

## Cambio
- Se incorpora `edDeliveryPersistAndInvalidate(key,items,reason)` para registrar cambios locales de proveedores y almacenes con una secuencia común: lectura previa, escritura, invalidación de revisión y restauración si falla la invalidación.
- Si también falla la restauración, se marca cuarentena, se rechazan cotizaciones locales y se bloquean nuevas modificaciones hasta verificar explícitamente en Administración de entregas.
- Migradas a este flujo las operaciones: editar, activar/desactivar y crear proveedores; guardar, activar/desactivar y registrar rápidamente almacenes.
- `tests/delivery-supplier-warehouse-atomicity.test.cjs` cubre restauración de proveedor y almacén tras invalidación fallida, invalidación exitosa, fallo doble y aviso móvil.
- [CI #43633908857](https://github.com/Liuben810921/enlace-digital/actions/runs/43633908857) pendiente de verificación final.

## Limitaciones
La secuencia de localStorage no es una transacción real; si la escritura falla después de haber alterado el almacenamiento, el navegador puede conservar datos parciales. El bloqueo es solo para demostración. Las cotizaciones reales requieren persistencia y validación atómica en servidor, control de permisos y rutas viales verificadas. No se tocaron Supabase, staging, producción, clientes reales, pedidos ni servicios.
