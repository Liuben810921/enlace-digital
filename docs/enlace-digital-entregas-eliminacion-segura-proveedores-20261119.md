# ENLACE DIGITAL — Eliminación segura de proveedores
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `b624e4ca97dd297a5f2976c6d19ff9da317393b3`, comparación inicial identical.

## Funcionalidad
Se añadió un botón **Eliminar** a cada proveedor del panel Administración de entregas. La función `edDeliverySupplierDelete` bloquea eliminaciones durante cuarentena, comprueba que el proveedor existe, y exige que **ningún almacén** (activo o inactivo) mantenga su `supplierId`. Solicita confirmación antes de borrar y usa `edDeliveryPersistAndInvalidate` con motivo `supplier_deleted`. No toca pedidos, checkout ni inventario real.

## Pruebas focalizadas
Fuente exacta de GitHub: `index.html` blob `d22bb649dd6e3aa93395dc15364b90030144859d`.
- Proveedor sin almacenes: eliminación confirmada, revisión invalidada, panel actualizado — **PASS**.
- Proveedor con almacén inactivo asociado: eliminación rechazada, sin mutaciones — **PASS**.
- Persistencia simulada fallida: no se confirma ni refresca la eliminación — **PASS**.
- Cuarentena activa: operación bloqueada — **PASS**.
- Sintaxis del JavaScript inline completo, V8 — **PASS**.

Pruebas aisladas de la función con dependencias ficticias, no pruebas Chromium móvil. Cotizaciones reales siguen en `PENDIENTE` sin rutas viales verificadas. Batería integral reservada para la fase previa a activación y sujeta a autorización.

Restricciones respetadas: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Sin nuevas auditorías generales.
