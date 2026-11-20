# Evidencia focalizada — reasignación y desvinculación de productos (2026-11-20)

**Base:** `499ca812a66082e7e106c5a3dc4cbcd6dd9ccfea`  
**Corrección:** `f0b72bc67b53719a2fbb2fe4c5eb8eb96f2708c8`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`

## Defecto reproducido
La función original `edDeliveryReassignWarehouse('a')` aceptó el mapa `{p:['a'],q:['nonexistent']}` con inventario sintético sincronizado, ejecutó una escritura y dejó `q` asociado al almacén inexistente. Se había validado el tipo y la unicidad de IDs, pero no su existencia en la lista de almacenes. La función `edDeliveryUnlinkWarehouseProducts` compartía el mismo control insuficiente.

## Corrección
Se añadió en ambas funciones una comprobación de existencia de cada almacén referido por el mapa completo antes de guardar. Los datos inconsistentes se rechazan sin escritura. No se modificaron contratos de cotización ni lógica de simulación.

## Pruebas focalizadas del código corregido — 4/4 PASS
Ejecutadas sobre las funciones extraídas del `index.html` actualizado en runtime JavaScript V8 aislado, con DOM, localStorage, productos y confirmaciones sintéticos.

| Caso | Resultado |
|---|---|
| Reasignación con asociación huérfana no seleccionada | Rechazo, 0 escrituras |
| Reasignación con asociaciones válidas | Éxito, 1 escritura; `p:['b']` |
| Desvinculación con asociación huérfana no seleccionada | Rechazo, 0 escrituras |
| Desvinculación con asociaciones válidas | Éxito, 1 escritura; `p:[]` |

**Límites:** no son pruebas de interfaz ni transacciones reales entre pestañas. Atomicidad entre pestañas **PENDIENTE**. No se repitieron pruebas anteriores ni se intentó Chromium. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, servicios externos, instalaciones, despliegues ni costos.
