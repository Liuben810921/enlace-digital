# Reasignación y desvinculación de productos — pruebas focalizadas

Rama `plan/havana-osrm-benchmark-offline-20261114`, base `6deff366f7e179b097dbd57d215b185d1509fd77` comparada `identical`. Commit `a26f62a05a83ac9a0e81fd594026d05a04a6ca8d`, blob `7a4ca5170b3b0d280a76ad76dfb958ae11df3a29`.

## Cambio funcional

Se eliminó de las tarjetas de almacenes una casilla `edSupplierBulkCheck` que había sido introducida accidentalmente durante el desarrollo de operaciones masivas de proveedores. La selección de proveedores permanece únicamente en sus tarjetas; la de almacenes usa `edOriginBulkCheck`. Evita confusión y contaminación de la interfaz de gestión de dependencias.

## Pruebas dinámicas ejecutadas

Se extrajeron literalmente `edDeliveryReassignWarehouse` y `edDeliveryUnlinkWarehouseProducts` del HTML actual. Se ejecutaron en V8 con mocks de DOM, almacenamiento, inventario, lectores, confirmación y persistencia, verificando retorno, número de persistencias y asociaciones resultantes.

1. Reasignar `p1` de `w1` a `w2`, ambos del proveedor `s1`: true; una persistencia; asociación final `p1:[w2]`.
2. Desvincular `p1` de `w1`: true; una persistencia; asociación final `p1:[]`.
3. Rechazar destino de otro proveedor: false; cero persistencias; asociación sin cambios.
4. Rechazar selección de producto inexistente: false; cero persistencias.
5. Rechazar modificación sintética de asociaciones durante confirmación: false; cero persistencias del manejador (el mock modifica deliberadamente el almacenamiento).
6. Rechazar inventario con guardados pendientes: false; cero persistencias.
7. Rechazar operación durante cuarentena: false; cero persistencias.

**Resultado: 7/7 satisfactorios.** No se implementó reasignación de productos entre proveedores distintos, ya que requiere coordinar datos y preservar invariantes; permanece bloqueada. La persistencia compartida insegura y la atomicidad entre pestañas siguen **PENDIENTES**. Pruebas sintéticas, no navegador ni concurrencia real. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
