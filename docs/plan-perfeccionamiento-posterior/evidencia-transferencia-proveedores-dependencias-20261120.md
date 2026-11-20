# Evidencia — transferencia masiva entre proveedores (2026-11-20)

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `cd4725440b029b44345b1b8d284c2fd7ee7abcd4`  
**Corrección:** `f88586f13802a6311f160b8a81fe2f8955bfe27f`

## Defecto reproducido antes del cambio
En `edDeliveryOriginsTransferSelectedSupplier`, la validación de asociaciones exigía arreglos de IDs de tipo string sin duplicados, **pero no exigía que esos almacenes existieran**. Fixture: almacén `w1` del proveedor `s1`, proveedor destino `s2`, y asociación `orphan: ['missing-warehouse']`. Resultado real previo: `true`, una escritura y `w1` transferido a `s2`, manteniendo la referencia huérfana. Esto permitía seguir operando sobre dependencias inconsistentes.

## Cambio acotado
Se reforzó exclusivamente la validación de asociaciones en `edDeliveryOriginsTransferSelectedSupplier` dentro de `index.html`: rechazo de almacenes desconocidos, inactivos y mezclas incompatibles de tipo/proveedor en una misma asociación. Se mantiene el mecanismo existente de instantáneas y persistencia, **sin atribuirle atomicidad entre pestañas**.

## Pruebas focalizadas posteriores: 5/5 PASS
Se ejecutó la función real del nuevo `index.html` en JavaScript V8 con DOM, localStorage, inventario y confirmaciones sintéticos.

| Caso | Resultado |
|---|---|
| Asociación huérfana con almacén inexistente | Rechazo; cero escrituras |
| Asociación que combina almacén conocido con ID desconocido | Rechazo; cero escrituras |
| Producto asociado a dos almacenes, transferencia parcial | Rechazo; cero escrituras |
| Transferencia válida sin productos asociados | Éxito; una escritura |
| Transferencia válida con producto proveedor asociado únicamente al almacén seleccionado e inventario sincronizado | Éxito; una escritura |

**Límites:** pruebas aisladas, no navegador móvil, no GitHub Actions, no ejecución de cotizaciones reales. No se repitieron pruebas previas. La persistencia compartida y atomicidad entre pestañas permanecen **PENDIENTES**. Sin Supabase, staging, producción, pedidos reales, servicios externos, instalaciones, despliegues ni costos.
