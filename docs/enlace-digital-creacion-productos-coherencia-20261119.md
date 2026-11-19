# Seguimiento focalizado: creación, alias y asociaciones — 2026-11-19

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Base verificada: `6c2fc925911658373804895bb1b01681920cab52`. Corrección: `c24dd26af276dcf2dc3360dece2dc9e1e1901f55`.

## Pruebas ejecutadas
Se extrajo y ejecutó la función real `createProduct()` con dependencias simuladas y datos ficticios. Caso A: una variante con cantidad 2 -> producto creado en memoria. Caso B: dos variantes con cantidades `Number.MAX_SAFE_INTEGER` y `1` -> rechazo antes de insertar el producto. **2/2 PASS**.

## Defecto corregido
La creación aún utilizaba `Number.isInteger` mientras la edición ya utilizaba `Number.isSafeInteger`. La suma de variantes podía perder precisión. Se alineó la validación del formulario de creación con la edición.

## Riesgos observados — PENDIENTE
`createProduct()` guarda primero el producto localmente, inicia sincronización asíncrona y guarda asociaciones locales antes de esperar confirmación del inventario remoto. El alias privado de proveedor se agenda mediante `edInventoryQueue.then(...)`, por lo que un error de sincronización absorbido por la cola podría permitir un intento posterior del alias. La coherencia transaccional entre producto, alias y asociaciones no está probada. No se han modificado estos flujos sin pruebas de reproducción focalizadas. La reconciliación de escrituras parciales y los reintentos siguen **PENDIENTE**.

No se ejecutó navegador ni integración remota. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. La batería integral permanece reservada para autorización previa.
