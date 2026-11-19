# Prueba focalizada de sincronización de inventario — 2026-11-19

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Corrección: `3f95f9db3b48b0e0556642b18168631750ea73a6`.

## Defecto reproducido
`edQueueInventory()` capturaba fallos de `edApi` y resolvía su promesa sin informar al llamador. `saveEditedProduct()` continuaba tras `await edInventoryQueue` y podía cerrar el editor aunque el inventario no se hubiera sincronizado.

## Prueba ejecutada sobre la función real extraída de index.html
Se extrajo `edQueueInventory()` sin modificar su cuerpo y se ejecutó en JavaScript con dependencias simuladas y datos ficticios. Escenario 1: API simulada exitosa -> resultado `true`. Escenario 2: API simulada rechaza la petición -> resultado `false`. **2/2 PASS**. Se comprobó además en el código actualizado que `saveEditedProduct()` exige `await edInventoryQueue === true` antes de avanzar.

## Límites
No se ejecutó `saveEditedProduct()` completo en navegador, ni integración con servidor, ni asociaciones de almacenes, ni rollback transaccional de productos. Estos escenarios siguen **PENDIENTE**. La corrección evita confirmar visualmente un fallo de sincronización, pero no constituye una transacción atómica entre inventario remoto y asociaciones locales. No se realizaron descargas, despliegues, GitHub Actions ni acceso a Supabase/staging/producción.
