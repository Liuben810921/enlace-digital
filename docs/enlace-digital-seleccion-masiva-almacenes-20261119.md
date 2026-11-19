# Asociaciones de productos: selección masiva de almacenes — 2026-11-19

Base `f7bb3a50c09118822287cb055dce8afe239429b3`. Implementación `8156a39db658118750c573b67c54cbaa7eb74d7e`.

## Funcionalidad
Se añadieron botones **Seleccionar todos** y **Quitar selección** al panel de almacenes del formulario de alta y edición de productos. Actúan únicamente sobre las casillas de almacenes visibles en el panel actual (por tipo y proveedor seleccionado), respetan casillas deshabilitadas y no operan durante cuarentena. No guardan datos hasta que se confirme el producto.

## Verificación focalizada
Se ejecutaron las funciones reales `edProductOriginsSelectAll` y `edProductOriginsClear` con dos casillas habilitadas y una deshabilitada. Seleccionar todos: `[true,true,false]`; quitar selección: `[false,false,false]`. PASS.

## PENDIENTE
Persistencia compartida de proveedores, almacenes, destinos y asociaciones; integración de cartografía vial verificada y cotización real; prueba visual móvil; batería integral con autorización previa. La selección masiva es una mejora local y no implica integración remota.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
