# Inventario: segunda lectura y cambios concurrentes — 2026-11-19

Base 0d40878e7ef742a5b7de3459068caabd7054cf00; rama plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical.

## Defecto reproducido y mitigación
La paginación por cursor no detectaba inserciones detrás del cursor ni modificaciones de filas ya leídas. Se añadió segunda lectura paginada y comparación estricta de respuestas JSON antes de publicar state.products y activar edInventoryLoaded. Si difieren, se rechaza y no se persiste inventario. Se validan orden e IDs de ambas lecturas.

## Pruebas sintéticas focalizadas
Función real edLoadInventory extraída de index.html, con API y almacenamiento ficticios:
- catálogo estable de 1 producto: éxito, 2 llamadas, 1 escritura;
- inserción anterior al cursor: rechaza, señal false, 0 escrituras;
- modificación de origen_producto: rechaza, señal false, 0 escrituras;
- eliminación: rechaza, señal false, 0 escrituras;
- fallo de conexión en segunda lectura: rechaza, señal false, 0 escrituras;
- catálogo estable de 501 productos: éxito, 4 llamadas, 1 escritura.

6/6 resultados esperados. La guardia de transferencia ante inventario no cargado ya fue probada con la función real en la etapa anterior; no se repitió esa prueba.

## Limitaciones
Dos lecturas iguales no prueban instantánea transaccional: pueden existir cambios entre ambas o después de verificar, y el catálogo podría cambiar y revertirse. La segunda lectura duplica las solicitudes de inventario; no se ha medido impacto real. Para garantía fuerte hace falta soporte de snapshot o versión en servidor. No se accedió a Supabase ni se ejecutó navegador o batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
