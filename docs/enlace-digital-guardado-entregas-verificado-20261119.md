# Confirmación de persistencia antes de invalidar cotizaciones — 2026-11-19

Base: `71e37023d656abee2ab03437ac13825e4bcb4380`. Corrección: `d56af699641d4d50ac4a9834a70f969e1c8ed140`.

## Defecto reproducido
Se ejecutó la función real `edDeliveryPersistAndInvalidate()` con configuración previa `[\"old\"]` y escritura ficticia de `[\"new\"]`. La dependencia `localStorage.setItem` retornó sin guardar. Antes de la corrección: resultado `true`, valor persistido `[\"old\"]` e invalidación llamada una vez; falsa confirmación.

## Corrección
Después de `setItem` se compara `getItem(key)` con la serialización exacta. Una discrepancia entra al manejo de error existente antes de llamar a `edDeliveryContextInvalidate`.

## Pruebas posteriores (2/2 PASS)
- Escritura silenciosamente fallida: `false`, configuración anterior intacta, cero invalidaciones.
- Escritura correcta: `true`, configuración nueva persistida, una invalidación.

## PENDIENTE
No se han verificado en navegador real reinicios, durabilidad, permisos remotos, coherencia transaccional de inventario/alias/asociaciones ni pruebas integrales. La batería integral requiere autorización previa.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
