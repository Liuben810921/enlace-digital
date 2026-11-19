# Entregas: visibilidad de asociaciones en almacenes — 2026-11-19

Base: `3fc2d830be7ad11a32e5402c4450177dc7e1e7c7`. Funcionalidad implementada en `80e4b17098ea58170191cb661b2ecf5c4476ddab` y corrección de concatenación en `4410dbb3b93436fd872e40bdbaf0b818bddb2322`.

## Mejora funcional
El panel de Administración de entregas ahora indica en cada almacén cuántos productos están asociados según `edProductOriginsRead()`. Permite identificar dependencias antes de editar o eliminar almacenes, sin consultar individualmente cada producto. Los conteos se calculan al renderizar y no alteran datos.

## Comprobación focalizada
Se ejecutó la función real `edDeliveryOriginsPanel` extraída de `index.html` con datos ficticios: almacén `w`, asociaciones de productos 7 y 8 a `w`, producto 9 sin asociación. La salida HTML incluye `2 producto(s) asociado(s)`: PASS. La primera implementación tuvo un error de concatenación corregido antes de la verificación satisfactoria.

## PENDIENTE
Datos compartidos entre dispositivos, rutas viales verificadas para La Habana y cálculo operativo de mensajería, verificación visual móvil, batería integral con autorización previa. No se probó integración remota.

No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
