# Pruebas sintéticas focalizadas: transferencia de almacenes — 2026-11-19

Base: b5ddbf331d5564ace7a43d131d3ac7a8a5288780.
Corrección: ebb011ab044677369d0c7e8d459f15bb8a556fd8; ajuste de sintaxis: 8c17ff4e40bf6183813a2cda166a3889642cda1e.

## Método
Se recuperó index.html de la rama aislada mediante el conector de GitHub. Se extrajo la función real edDeliverySupplierTransferWarehouses y se ejecutó en un entorno JavaScript sintético con dobles de localStorage, proveedores, almacenes, inventario, confirmación y persistencia. No se ejecutó la interfaz ni se conectaron servicios. Se contaron escrituras simuladas y se inspeccionó el estado final.

## Resultados focalizados
| Escenario | Resultado | Escrituras | Estado |
|---|---|---:|---|
| Transferencia válida de w1 de s1 a s2 | true | 1 | supplierId=s2, defaultForSupplier=false, version=2 |
| Producto p1 asociado a w1 | false | 0 | Sin cambios |
| JSON de asociaciones malformado | false | 0 | Sin cambios |
| Cancelación de selección | false | 0 | Sin cambios |
| Modificación de asociaciones durante confirmación | false | 0 | Sin cambios |

Los cinco escenarios **PASS** dentro del arnés sintético de funciones. La persistencia simulada no demuestra el comportamiento de almacenamiento real ni la interacción móvil. Tampoco prueba simultaneidad transaccional entre pestañas, otros flujos de reasignación, recuperación tras fallo de disco, integración multiadministrador o cotizaciones reales.

## Pendiente
Pruebas focalizadas de interfaz móvil y demás operaciones, y batería integral únicamente con autorización independiente. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
