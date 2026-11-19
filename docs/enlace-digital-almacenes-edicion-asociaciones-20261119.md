# Administración de entregas: edición segura de almacenes — 2026-11-19

Base `782bd9537b1549ca2331bc43ae5d5abb081ada7d`; implementación `0b57eaf7950075c92d3499d6e63783bbd3f19972`.

## Funcionalidad corregida
El formulario `edDeliveryOriginSave` permitía cambiar el tipo de un almacén existente o el proveedor propietario sin comprobar si había productos asociados. Se reprodujo con almacén propio `w` asociado al producto 7: el formulario guardaba su tipo como `proveedor`.

Ahora, si el tipo o proveedor cambia, se comprueban las asociaciones locales antes de guardar. Si el almacén aparece asociado a un producto, se informa que debe reasignarse primero y no se modifica el registro. Se conserva la edición normal de almacenes sin asociaciones.

## Verificación focalizada (2/2 PASS)
- Almacén `w` asociado a producto 7: cambio propio → proveedor bloqueado; cero guardados.
- Almacén `w` sin asociaciones: cambio propio → proveedor permitido.

## PENDIENTE para completar esta rama
Integración de distancias viales verificadas y cotización real (sin activar hasta autorización), coherencia con asociaciones guardadas fuera del navegador, persistencia compartida entre dispositivos, pruebas visuales en navegador móvil con HTML exacto y batería integral previa autorización. Sin afirmar integración real.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
