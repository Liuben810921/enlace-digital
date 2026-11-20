# Eliminación masiva de almacenes sin productos — 2026-11-19

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base verificada `3a81b239ab49b67c55319f36df7a64973cb0793e`, comparación `identical` (sin commits posteriores). Implementación `74400101dfc705392d5c482215b90f2546d2f15d`.

## Operación incorporada

`edDeliveryOriginsDeleteSelected()` y botón «Eliminar seleccionados sin productos» en Administración de entregas. Rechaza cuarentena, selección vacía o duplicada, identificadores inexistentes, asociaciones malformadas y cualquier producto vinculado a los almacenes seleccionados. Exige confirmación explícita. Comprueba que no cambiaron los snapshots de almacenes, asociaciones y proveedores durante la confirmación. Si las condiciones se mantienen, persiste únicamente la clave de almacenes y actualiza el panel. No desvincula productos ni altera proveedores.

## Evidencia focalizada realmente ejecutada

Lectura del `index.html` en la rama tras el commit: blob `41b8c7393510a426b67d9f6784848192f094baa2`. Se verificaron 10 aserciones estáticas de integración: existencia del manejador, botón enlazado, cuarentena, selección duplicada, IDs inexistentes, dependencias de productos, confirmación, comparación de snapshots incluyendo proveedores, ruta única de persistencia y ausencia de escritura de asociaciones desde el manejador. Resultado: **10/10 comprobaciones estáticas satisfechas**.

**No se ejecutaron pruebas dinámicas ni Chromium**. Los casos de aceptación (eliminación sin asociaciones, rechazo con asociaciones, conflicto durante confirmación, cuarentena y error de persistencia) permanecen pendientes de prueba focalizada dinámica; no se presentan como superados.

## Límites

La comparación y escritura local no son transacción atómica entre pestañas. Persistencia compartida insegura y operaciones que exigen atomicidad entre clientes: **PENDIENTE**. No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
