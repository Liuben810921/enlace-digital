# Reasignación masiva de productos entre almacenes — 2026-11-19

Base: `a7fa85c81cdc5f81637c6b90878a76e295c70877`. Implementación: `64d923b9464e07efd3cea05847a5d6c411a97528`.

## Operación implementada
En Administración de entregas, un almacén con productos asociados ofrece selector de otro almacén activo del mismo tipo y, para proveedor, del mismo proveedor activo. El botón **Reasignar productos** solicita confirmación y sustituye la asociación origen por destino para todos los productos afectados, sin duplicar destinos ya existentes. Valida el conjunto antes de guardar y escribe el mapa de asociaciones en una sola operación local; verifica lectura posterior e invalida el contexto de cotización. Si no se confirma el guardado o la invalidación, intenta restaurar el valor previo y pone en cuarentena si no se confirma la restauración.

No modifica inventario remoto, stock ni pedidos; las asociaciones permanecen exclusivamente locales.

## Verificación focalizada — PASS
Función real `edDeliveryReassignWarehouse` ejecutada con dos productos ficticios: producto 1 asociado a `a`; producto 2 asociado a `a` y `b`. Cancelación: mapa intacto. Confirmación hacia `b`: producto 1 → [b], producto 2 → [b], sin duplicados.

## PENDIENTE
Comprobación visual móvil; persistencia compartida entre administradores; integración cartográfica y distancias viales verificadas; batería integral previa autorización. No se declara lista la cotización real.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
