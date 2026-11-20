# Pruebas dinámicas focalizadas de operaciones masivas — 2026-11-19

Rama `plan/havana-osrm-benchmark-offline-20261114`. Base `300e3ce0c65ee624c2a2525b8de8cd8c121ace3f` comparada `identical`. Cambio `c74c2b54886d6ab9883406597344aba1f99670c7`, blob `b3e24c541b72c931b7c58fc47f19e4e43df03b64`.

## Método ejecutado

Se extrajeron literalmente las funciones reales `edDeliveryOriginsDeleteSelected`, `edDeliveryOriginsSetSelectedActive` y `edDeliveryOriginsMoveSelected` del `index.html` leído de GitHub. Se ejecutaron con JavaScript en un entorno V8 aislado, usando mocks de `document`, selección `.edOriginBulkCheck:checked`, `localStorage`, confirmación, lectores y `edDeliveryPersistAndInvalidate`. Se capturaron resultados, escrituras y estados finales. No hubo navegador, GitHub Actions ni datos reales.

## Casos y resultados

1. Eliminar almacén sin asociaciones: `true`, una escritura, solo permanece almacén no seleccionado.
2. Rechazar eliminación con producto asociado: `false`, cero escrituras.
3. Eliminar almacén no asociado cuando otro almacén tiene productos (casillas de producto anidadas no contaminan selección): `true`, una escritura.
4. Detectar modificación de asociaciones durante confirmación: `false`, cero escrituras de almacenes; una escritura sintética deliberada en el mock de asociaciones.
5. Desactivar almacén sin productos mientras otro almacén está asociado: `true`, una escritura, versión 2→3.
6. Rechazar desactivación con productos asociados: `false`, cero escrituras.
7. Mover dos almacenes al municipio Centro, uno ya ubicado allí: `true`, una escritura, versión del primero permanece 1 y versión del segundo cambia 2→3.
8. Cuarentena activa: eliminación `false`, cero escrituras.

**8/8 resultados esperados**. La corrección adicional del caso 7 evita incrementar versiones de registros sin cambio de municipio.

## Límites y próximos pasos

Los mocks no demuestran comportamiento de navegador, sincronización real, ni atomicidad entre pestañas. Pendiente avanzar en operaciones sustanciales de proveedores y sus almacenes, con pruebas focalizadas independientes. Persistencia compartida insegura y operaciones que requieren atomicidad entre pestañas: **PENDIENTE**. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
