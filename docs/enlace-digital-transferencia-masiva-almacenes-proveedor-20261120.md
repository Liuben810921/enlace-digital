# Transferencia masiva de almacenes entre proveedores — 2026-11-20

Base `385054781fbae3724103d958b5a4b01d2ef9cf90`, rama `plan/havana-osrm-benchmark-offline-20261114`, comparación `identical`. Implementación `b245431cb136ba5e53bcadf148c4332d1a628802`, blob `be705085507078ad182e26c51a623918a1770fd3`.

## Función implementada

`edDeliveryOriginsTransferSelectedSupplier()` permite seleccionar almacenes de tipo proveedor en el panel masivo, elegir proveedor activo de destino y transferir únicamente almacenes sin productos asociados. Verifica unicidad/existencia/tipo de IDs, formato de asociaciones, dependencias de productos, snapshots de almacenes/proveedores/asociaciones y confirmación. Modifica solo `ED_DELIVERY_ORIGINS_KEY` mediante `edDeliveryPersistAndInvalidate`, incrementa versión solo de almacenes efectivamente transferidos y restablece `defaultForSupplier:false`.

## Pruebas dinámicas focalizadas ejecutadas

Función real extraída de `index.html`, ejecutada en V8 con mocks de DOM, localStorage, confirmación y persistencia. **10/10 resultados esperados**:

1. Transferir dos almacenes de s1 a s2: true, una persistencia, versiones 1→2 y 2→3.
2. Rechazar almacén con producto asociado: false, cero persistencias.
3. Transferir solo almacén no asociado aunque otro tenga producto: true, una persistencia.
4. Rechazar almacén propio: false.
5. Rechazar proveedor de destino inexistente: false.
6. Rechazar IDs duplicados: false.
7. Rechazar asociaciones malformadas: false.
8. Rechazar modificación sintética de asociaciones durante confirmación: false.
9. Rechazar cuarentena: false.
10. Respetar cancelación: false.

## Límites

Se conserva bloqueada la transferencia de almacenes que tengan productos asociados; requiere reasignación/desvinculación previa. Las pruebas son sintéticas, no navegador ni concurrencia real. La persistencia compartida insegura y cualquier operación que exija atomicidad entre pestañas permanecen **PENDIENTES**. No se usaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
