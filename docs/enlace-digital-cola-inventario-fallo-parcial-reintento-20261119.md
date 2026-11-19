# Cola de inventario: fallo parcial y recuperación — 2026-11-19

Base 53aee84d0770a4258a35a3c9b4065cdc67994ef8; rama plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical.

## Prueba sintética focalizada
Se ejecutó la función real edQueueInventory extraída de index.html con dos productos, API, token, fotos y almacenamiento simulados. No hubo conexión remota.

1. Primer producto: escritura remota ficticia exitosa; segundo producto: petición pendiente que termina con error deliberado.
2. Mientras la segunda petición está pendiente: edInventoryPendingSaves=1, edInventorySnapshot='[]', una escritura remota ficticia aplicada. La condición de bloqueo de transferencias edInventoryPendingSaves>0 es verdadera.
3. Tras el error: resultado false, contador=0, snapshot permanece '[]'; se preserva la diferencia entre memoria y snapshot, por lo que la transferencia sigue bloqueada por su comprobación de sincronización.
4. Reintento sin error: resultado true, contador=0, se escriben ambas filas, snapshot final coincide con los dos productos.
5. Fotos: se simularon dos conversiones data:image a URL; al reintentar no hubo nuevas conversiones, total uploads=2. Llamadas de productos: [1,2,1,2].

## Conclusión
No se reprodujo defecto nuevo en la cola bajo estos escenarios. No se modificó index.html; únicamente se documentó la evidencia.

## Limitaciones
Las escrituras remotas son ficticias. El fallo parcial no implica atomicidad de operaciones en un servidor real; durante la recuperación puede haber diferencias temporales. La condición de bloqueo de transferencia se verificó mediante el contador real de la cola y la guardia ya probada previamente, no mediante una nueva ejecución integrada de la función de transferencia. No se ejecutó navegador ni batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
