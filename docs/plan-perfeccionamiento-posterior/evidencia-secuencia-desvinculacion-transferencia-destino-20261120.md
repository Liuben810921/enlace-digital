# Evidencia de secuencia encadenada — producto compartido, transferencia parcial y destino

**Fecha:** 2026-11-20  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `11327005d4ccf4aa0232b1d8e1046ae7ce11c102` (HEAD idéntico al iniciar)

## Escenario y método
Funciones **reales** extraídas de `index.html`: `edDeliverySupplierTransferWarehouses`, `edDeliveryUnlinkWarehouseProducts` y `edDeliveryDestinationsMoveSelected`. Ejecutadas **encadenadas en el mismo runtime V8**, compartiendo estado sintético mutable de `localStorage`, inventario sincronizado, DOM, confirmaciones y persistencia con comparación de instantáneas. No son pruebas visuales de navegador.

Fixture inicial: proveedor `s1` con almacenes `w1`, `w2`; proveedor destino `s2`; producto `p` de tipo proveedor asociado a ambos almacenes; destino `d` en Playa con coordenadas y dirección manual `Calle 1`.

## Resultados: 4/4 PASS

1. **Transferencia parcial inicial `w1` de `s1` a `s2`:** rechazada por asociación compartida `p:['w1','w2']`. Cero escrituras.
2. **Desvincular `p` de `w1`:** operación aceptada; asociación restante `p:['w2']`. Escritura `warehouse_products_unlinked`.
3. **Reintentar transferencia de `w1` a `s2`:** operación aceptada; `w1.supplierId='s2'`, `w2.supplierId='s1'`; `p:['w2']` conservado. Escritura `supplier_warehouses_transferred`.
4. **Mover destino `d` a Centro Habana:** municipio actualizado; `lat=null`, `lng=null`; dirección manual conservada. Escritura `destinations_bulk_municipality`.

## Conclusión
El flujo encadenado de **desvinculación → transferencia parcial → actualización de destino** no reprodujo un defecto. No se modificó código operativo ni se repitieron pruebas previas aisladas. Las comprobaciones de reasignación como alternativa a desvinculación y otros escenarios encadenados siguen pendientes.

**Límites:** el doble de persistencia comprueba instantáneas dentro de una ejecución aislada; **no proporciona atomicidad entre pestañas**. Persistencia compartida segura y atomicidad **PENDIENTES**. Sin Chromium, GitHub Actions, Supabase, staging, producción, pedidos reales, servicios externos, instalaciones, despliegues ni costos.
