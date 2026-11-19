# Validación de asociaciones en recuperación de cuarentena — 2026-11-19

Base `57f5f72d776fef373d0a91dadedb68f2fc49436e`; corrección `4b8380f857d55bc4804b99f701cc577ec0f16e8f`.

## Defecto reproducido
Se ejecutó la función real `edDeliveryRecoverQuarantine()` con almacenamiento ficticio persistente y bandera de cuarentena activa tras reinicio simulado. Un producto tenía simultáneamente almacén propio `a` y almacén de proveedor `b`, ambos activos. Antes de corregir: recuperación `true`, cuarentena retirada y revisión invalidada pese a violar la regla de tipos de `edProductOriginsSave()`.

## Corrección
La recuperación verifica que cada conjunto de almacenes asociados tenga el mismo tipo y, para proveedores, el mismo `supplierId`.

## Pruebas posteriores (4/4 PASS)
- Asociación mixta propio/proveedor `[a,b]`: recuperación `false`, cuarentena permanece, cero invalidaciones.
- Dos proveedores distintos `[b,d]`: recuperación `false`, cuarentena permanece, cero invalidaciones.
- Dos almacenes propios `[a,c]`: recuperación `true`, cuarentena retirada, una invalidación.
- Un almacén de proveedor `[b]`: recuperación `true`, cuarentena retirada, una invalidación.

## PENDIENTE
Recuperación tras reinicio real, validación cruzada con origen del producto en inventario, confirmaciones parciales de alias e inventario, permisos y persistencia remotos y batería integral. Las pruebas usaron funciones extraídas del HTML con dependencias simuladas. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
