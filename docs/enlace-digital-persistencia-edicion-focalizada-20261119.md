# Persistencia y edición de proveedores: pruebas sintéticas — 2026-11-19

Base: 44b69f0bff579d6b119599006bb1fd17f84bde69. Rama aislada plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical, cero commits posteriores.

## Correcciones
- edDeliveryPersistAndInvalidate ahora intenta restaurar y verificar el valor previo incluso si setItem falla después de alterar el almacenamiento. Solo entra en cuarentena si la restauración falla o no se puede verificar.
- edDeliverySupplierEdit toma una instantánea del registro de proveedores antes del diálogo y rechaza la edición si cambió durante el diálogo.

## Ejecución de funciones reales con dobles sintéticos
| Función | Escenario | Resultado |
|---|---|---|
| Persistencia | Guardado normal | PASS: true, una escritura |
| Persistencia | Escritura falla antes de modificar datos | PASS: false, valor anterior intacto |
| Persistencia | Escritura modifica datos y luego lanza excepción | PASS: false, valor anterior restaurado y verificado |
| Persistencia | Invalidación de cotización falla | PASS: false, valor anterior restaurado |
| Persistencia | Escritura parcial y restauración también falla | PASS: false, cuarentena activada; estado incierto conservado para recuperación |
| Editar proveedor | Renombrado normal | PASS: una llamada de persistencia |
| Editar proveedor | Cambio externo durante diálogo | PASS: cero llamadas de persistencia |
| Editar proveedor | Cancelación del diálogo | PASS: cero llamadas de persistencia |

Se ejecutaron ocho escenarios focalizados válidos. En una exploración inicial, un escenario llamado rollback_failure no simulaba realmente fallo alguno y se descartó; se sustituyó por la simulación correcta de escritura parcial seguida de fallo en restauración, que activó cuarentena.

## Limitaciones
Arnés JavaScript sintético, sin navegador ni almacenamiento real. No garantiza atomicidad entre pestañas ni cubre todas las operaciones de edición. Pendientes: pruebas focalizadas de edDeliveryOriginSave y edDeliveryDestinationSave, recuperación real de cuarentena y batería integral previa autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
