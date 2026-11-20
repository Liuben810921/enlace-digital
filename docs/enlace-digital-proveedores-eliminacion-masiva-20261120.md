# Eliminación masiva de proveedores — 20 de noviembre de 2026

Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base `fdaef2d053e700d1cd9ad321ac70268993339fdd`: comparación `identical` (sin commits posteriores). Implementación `b0e4ce8b354ea9ce18092755245aecafc2546a28`, blob `e79ccabb48aab16b14d8f18140f3cb8888f13245`.

## Función implementada

`edDeliverySuppliersDeleteSelected` y controles de selección en tarjetas de proveedores, dentro de `edSupplierBulkSelection`. Selecciona exclusivamente `.edSupplierBulkCheck:checked`, valida IDs únicos y existentes, comprueba la legibilidad de asociaciones, impide eliminar proveedores con almacenes vinculados, exige confirmación, comprueba snapshots de proveedores, almacenes y asociaciones antes del guardado, y persiste únicamente proveedores a través de `edDeliveryPersistAndInvalidate`. No realiza una transacción entre claves ni entre pestañas.

## Pruebas dinámicas ejecutadas

Se extrajo la función real desde `index.html` y se ejecutó en JavaScript V8 con `document`, `localStorage`, confirmación y persistencia simulados. Ocho escenarios, **8/8 satisfactorios**:

1. Eliminar proveedor sin almacenes: `true`, una persistencia.
2. Rechazar proveedor con almacenes: `false`, cero persistencias.
3. Rechazar IDs duplicados: `false`, cero persistencias.
4. Rechazar ID inexistente: `false`, cero persistencias.
5. Rechazar asociaciones malformadas: `false`, cero persistencias.
6. Rechazar modificación sintética de almacenes durante confirmación: `false`, cero persistencias de proveedores.
7. Rechazar cuarentena: `false`, cero persistencias.
8. Cancelar confirmación: `false`, cero persistencias.

**Limitaciones:** pruebas focalizadas con mocks, no navegador ni integración real entre pestañas. La seguridad de persistencia compartida y la atomicidad entre pestañas siguen **PENDIENTES**. No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
