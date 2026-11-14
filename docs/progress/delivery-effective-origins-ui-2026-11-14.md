# Administración de entregas: almacenes efectivos — 14 noviembre 2026

## Verificación previa
GitHub Actions [#43632173224](https://github.com/Liuben810921/enlace-digital/actions/runs/43632173224) **success**, incluidos ensayos RLS, permisos mínimos, rollback y conflictos en PostgreSQL desechable. RLS se mantiene limitado al laboratorio; no hay integración de identidad de Supabase. La documentación oficial PostgreSQL 16 distingue permisos SQL y políticas RLS y exige que ambas capas se apliquen.

## Integración aislada en index.html
- `edDeliveryOriginEligible`: comprueba almacén activo, tipo propio/proveedor y proveedor activo.
- `edDeliveryEffectiveOrigins`: filtra por asociación guardada al producto, tipo, almacén activo y proveedor activo. No calcula rutas ni precios.
- El selector de almacenes del producto y el cambio de proveedor reutilizan la comprobación de elegibilidad.
- El registro rápido de almacenes exige proveedor activo y aumenta versión de almacén e invalida contexto local.
- La recolección de casillas marcadas excluye almacenes que se desactivaron o quedaron asociados a un proveedor inactivo mientras el formulario permanecía abierto.
- Nueva prueba `tests/delivery-effective-origins-ui.test.cjs` verifica almacenes inactivos, proveedores inactivos, ausencia de asociación y selección visible.
- Dos ejecuciones de CI detectaron una aserción heredada que exigía el antiguo filtro inline `x.supplierId===supplierId`. Se actualizó la aserción para comprobar la nueva función centralizada. [CI #43632385329](https://github.com/Liuben810921/enlace-digital/actions/runs/43632385329) pendiente de confirmación.

## Limitaciones
Solo cambia la interfaz de la rama aislada y su persistencia local de demostración; no hay backend autorizado de despacho, validación real de rutas ni cotización comercial. La selección efectiva debe verificarse de nuevo en el servidor antes de habilitar compras. No se tocaron Supabase, staging, producción, clientes reales, pedidos, pagos ni servicios externos. El almacén confirmado en 23.13024, -82.36028 sigue sin nombre comercial asignado.
