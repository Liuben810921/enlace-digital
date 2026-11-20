# Transferencia de almacenes: interfaz de selección — 2026-11-19

Base b60a3af55d66c1d45ede2f5eaf9d5c895efca5af, rama plan/havana-osrm-benchmark-offline-20261114, comparación inicial identical.

## Cambio funcional
Commit 6c5729aa48a371909066296b1d58936bd431506f; index.html blob 2d6401a5dbd175aca13405b8e1a3f7b1b43f9fda.

edDeliveryOriginsPanel presenta un bloque desplegable por proveedor, con selector de proveedor de destino activo y casillas por almacén de origen, indicando su número de productos asociados. edDeliverySupplierTransferWarehouses lee los IDs seleccionados y el proveedor elegido desde controles DOM, en lugar de prompts manuales. La selección inicial incluye todos los almacenes, permitiendo desmarcar algunos. Se conservan las validaciones de dependencia, inventario y confirmación anteriores.

## Verificación focalizada
Se ejecutó la función real modificada en JavaScript aislado con DOM y almacenamiento sintéticos:
1. w1 hacia s2: true, una escritura; solo w1 cambia.
2. Ningún almacén marcado: false, cero escrituras.
3. Proveedor de destino vacío: false, cero escrituras.
4. w1 y w2 hacia s2: true, una escritura; ambos cambian.
**4/4 escenarios esperados.** Compilación sintáctica de las funciones modificadas correcta. Sin navegador ni batería integral.

## Límites
El nuevo panel aún no se ha probado visualmente en navegador. La transferencia no mueve productos asociados; exige resolver sus dependencias antes. Persistencia compartida insegura y operaciones que requieren atomicidad entre pestañas: PENDIENTE, sin reabrir investigación. Sin despliegue.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
