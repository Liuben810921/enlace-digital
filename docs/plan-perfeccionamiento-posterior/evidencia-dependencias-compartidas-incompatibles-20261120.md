# Evidencia focalizada — dependencias compartidas incompatibles

**Fecha:** 2026-11-20  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `f0cc00fb998a8c9709ccb680590db2c640bf6380`  
**Corrección:** `cf692219b0c4bd9a2bbbbcb256b3083daeaa910f`

## Defecto reproducido
Con almacenes `a` y `b` del proveedor `s1`, almacén `c` del proveedor `s2`, y asociaciones `{p:['a'],q:['b','c']}`, la función original `edDeliveryReassignWarehouse('a')` devolvió `true` y escribió `p:['b']` sin rechazar la asociación incompatible `q:['b','c']`. La comprobación existente detectaba almacenes inexistentes, pero no mezclas de proveedores ni almacenes inactivos en el mapa completo. `edDeliveryUnlinkWarehouseProducts` compartía esa validación incompleta.

## Corrección acotada
Se reforzaron las validaciones del mapa completo en ambas funciones: se rechazan almacenes inexistentes, inactivos y asociaciones que mezclan tipos o proveedores. No se cambiaron otras funciones ni el cotizador.

## Pruebas focalizadas posteriores: 6/6 PASS
Funciones reales extraídas del `index.html` corregido, ejecutadas en V8 con dependencias DOM/localStorage/inventario sintéticas.

| Operación | Caso | Resultado |
|---|---|---|
| Reasignar | Otro producto asociado a almacenes de dos proveedores | Rechazado, 0 escrituras |
| Reasignar | Otro producto asociado a almacén inactivo | Rechazado, 0 escrituras |
| Reasignar | Asociaciones compatibles | Éxito, 1 escritura; `p:['b']` |
| Desvincular | Otro producto asociado a almacenes de dos proveedores | Rechazado, 0 escrituras |
| Desvincular | Otro producto asociado a almacén inactivo | Rechazado, 0 escrituras |
| Desvincular | Asociaciones compatibles | Éxito, 1 escritura; `p:[]` |

**Límites:** no son pruebas visuales de navegador ni garantizan atomicidad entre pestañas. No se repitieron pruebas anteriores ni se intentó Chromium. **PENDIENTE** persistencia compartida segura y atomicidad entre pestañas. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, servicios externos, instalaciones, despliegues ni costos.
