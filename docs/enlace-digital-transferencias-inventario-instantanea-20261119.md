# Integridad del inventario durante transferencias — 2026-11-19

Base c4a81a8d18ff6692895730bdc9d04e1a2e746d85; comparación inicial identical. Rama aislada plan/havana-osrm-benchmark-offline-20261114.

## Cambio
edDeliverySupplierTransferWarehouses valida state.products como array, cada registro con ID y origen_producto tipo string, y ausencia de IDs duplicados tras String(id). Captura instantánea de pares [id, origen_producto] y la revalida después de la confirmación, antes de persistir. Bloquea inventario no cargado y modificaciones detectadas.

## Pruebas sintéticas
Funciones reales edDeliverySupplierTransferWarehouses y edDeliveryPersistAndInvalidate ejecutadas juntas con estado, almacenamiento y confirmaciones ficticios:

| Escenario | Resultado |
|---|---|
| Transferencia válida | PASS, una escritura |
| Dos productos con mismo ID | PASS, cero escrituras |
| Producto sin origen_producto | PASS, cero |
| Tipo modificado durante confirmación | PASS, cero |
| Producto retirado durante confirmación | PASS, cero |
| Inventario no cargado | PASS, cero |
| Invalidación fallida | PASS, rollback |
| Rollback fallido | PASS, cuarentena |

8/8 resultados esperados.

## Límites
La instantánea cubre IDs y origen_producto, no todos los campos del inventario. No asegura carga completa desde origen remoto ni atomicidad frente a modificaciones posteriores a la última comparación. No se ejecutó navegador, localStorage real ni batería integral. Pendiente: validar identidad/carga completa del inventario mediante metadatos de origen y concurrencia en límite de escritura.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
