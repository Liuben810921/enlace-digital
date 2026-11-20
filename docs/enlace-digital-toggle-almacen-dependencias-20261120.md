# Dependencias en activación y desactivación individual de almacenes — 2026-11-20

Base `6877872929e44d48a379e740c690e9e43ff494ab`, rama `plan/havana-osrm-benchmark-offline-20261114`, comparación `identical`. Implementación `be5ca0136ca74ab01098cb94d8a8aa4a40437785`, blob `9dd9731d0c2e0b2ee146bc0ba27ab93d28a55cba`.

## Corrección funcional

`edDeliveryOriginToggle` verifica snapshots de almacenes, proveedores y asociaciones, bloquea la activación si el proveedor está inactivo, bloquea desactivación con productos asociados, valida las asociaciones, exige confirmación, compara snapshots y guarda la única clave de almacenes con valor previo esperado. Incrementa la versión del almacén modificado.

## Pruebas dinámicas focalizadas

Función real extraída de `index.html` y ejecutada en V8 con mocks de localStorage, lectores, confirmación y persistencia. **9/9 resultados esperados**:

1. Desactivar almacén sin productos: true, una persistencia.
2. Activar almacén con proveedor activo: true, una persistencia.
3. Rechazar activación con proveedor inactivo: false, cero persistencias.
4. Rechazar desactivación con producto asociado: false, cero persistencias.
5. Rechazar modificación sintética de asociaciones durante confirmación: false, cero persistencias del manejador.
6. Rechazar modificación sintética de proveedores durante confirmación: false, cero persistencias del manejador.
7. Rechazar asociaciones malformadas: false, cero persistencias.
8. Respetar cancelación: false, cero persistencias.
9. Rechazar cuarentena: false, cero persistencias.

**Límites:** ejecución sintética, no navegador ni concurrencia real. Persistencia compartida insegura y atomicidad entre pestañas siguen **PENDIENTES**. No GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
