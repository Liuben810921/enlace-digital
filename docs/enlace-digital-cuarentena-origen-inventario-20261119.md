# Recuperación de cuarentena coherente con inventario — 2026-11-19

Base `a2db5e57b3aaf57dc924bc44b33ed0000d5ae333`; corrección `05176ff3607fb8766060859acb528cf88d70cfbe`.

## Defecto reproducido
La función real `edDeliveryRecoverQuarantine()`, con dependencias ficticias y cuarentena persistente, aceptaba asociación de producto 7 a almacén propio `a` mientras `state.products` cargado indicaba `origen_producto:'proveedor'`. Antes: recuperación `true`, cuarentena retirada y una invalidación.

## Corrección
Si hay asociaciones, la recuperación requiere `edInventoryLoaded`. Para cada producto presente en inventario con almacenes asociados comprueba que el tipo de esos almacenes coincida con `origen_producto`. Se preservan validaciones previas de proveedores, almacenes activos y tipo homogéneo.

## Pruebas focalizadas posteriores (3/3 PASS)
- Inventario cargado y tipo incompatible: `false`, cuarentena conservada, cero invalidaciones.
- Inventario cargado y tipo compatible: `true`, cuarentena retirada, una invalidación.
- Inventario no cargado con asociaciones: `false`, cuarentena conservada, cero invalidaciones.

## PENDIENTE
Coherencia de alias privados (persistencia remota), productos inexistentes o archivados en asociaciones, cambios concurrentes entre dispositivos, reinicio real del navegador y batería integral. No se infiere integración real de estas simulaciones. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
