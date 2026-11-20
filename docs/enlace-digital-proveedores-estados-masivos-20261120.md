# Estados masivos de proveedores y dependencias — 2026-11-20

Base `6f371b16d47a8afb2a421a7a6ef9bc468d224b8b`, rama `plan/havana-osrm-benchmark-offline-20261114` comparada `identical`. Código `dddcd3aab9f505fc8dfa37e35b7a1b06fec4e0bd`, blob `14026ca615e29e89705eccaa6ee168ccdd5a3690`.

## Función

Se incorpora `edDeliverySuppliersSetSelectedActive(active)` y botones de activación/desactivación en el fieldset existente `edSupplierBulkSelection`. Se filtran casillas `.edSupplierBulkCheck:checked`, se verifican IDs únicos y existentes, asociaciones bien formadas, y se impide desactivar proveedores con productos asociados a sus almacenes. Se toman snapshots de proveedores, almacenes y asociaciones, se pide confirmación y se actualiza exclusivamente la clave de proveedores mediante `edDeliveryPersistAndInvalidate` con expectativa de valor previo. No se cambian asociaciones ni almacenes.

## Pruebas dinámicas ejecutadas

Se extrajo literalmente la función del `index.html` guardado y se ejecutó en V8 con mocks de DOM, localStorage, lectores, confirmación y persistencia. Nueve casos, **9/9 satisfactorios**:

1. Activar proveedor inactivo: true, una persistencia.
2. Desactivar proveedor sin productos asociados: true, una persistencia.
3. Bloquear desactivación de proveedor con producto asociado a su almacén: false, cero persistencias.
4. Rechazar selección duplicada: false, cero persistencias.
5. Rechazar proveedor inexistente: false, cero persistencias.
6. Rechazar asociaciones malformadas: false, cero persistencias.
7. Detectar modificación sintética de almacenes durante confirmación: false, cero persistencias de proveedores.
8. Rechazar operación en cuarentena: false, cero persistencias.
9. Respetar cancelación: false, cero persistencias.

**Limitaciones**: no son pruebas de navegador ni de persistencia real multi-pestaña. La persistencia compartida insegura y cualquier operación que requiera atomicidad entre pestañas siguen **PENDIENTES**. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
