# Fallos locales y consistencia de páginas de inventario — 2026-11-19

Base 3cf3800fbcb7adaec4319c99bd3a5495c6f06275; rama aislada plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical.

## Correcciones
1. edLoadInventory construye nextState y persiste la copia local antes de publicar state.products y edInventorySnapshot. Si setItem falla, el catálogo anterior permanece en memoria y edInventoryLoaded sigue false.
2. Valida orden estrictamente creciente de IDs en cada página y entre páginas. Rechaza solapamientos y páginas desordenadas, además de duplicados generales ya comprobados.

## Pruebas sintéticas focalizadas
Función real de carga con API y almacenamiento simulados:
- setItem falla: carga rechazada, señal false, catálogo anterior intacto;
- promesa de carga pendiente: señal false (la transferencia queda bloqueada por su guardia edInventoryLoaded); al resolver, señal true;
- página solapada: rechaza, sin escrituras;
- página desordenada: rechaza, sin escrituras;
- dos páginas consistentes con 501 registros: acepta, una escritura.

5 escenarios, resultados esperados. La transferencia durante carga se evaluó por la guardia de señal, no se ejecutó la función completa en ese escenario.

## Límites
La paginación por offset no detecta necesariamente eliminaciones o inserciones que causen omisiones sin duplicados ni desorden; no ofrece instantánea remota transaccional. El control de generación no elimina todas las ventanas de concurrencia entre setItem y publicación del estado. No se consultó Supabase ni se usó navegador real.

Pendientes: detectar omisiones entre páginas con mecanismo de cursor/versión de servidor, prueba conjunta de transferencia con promesa pendiente, reintentos y restauración ante almacenamiento parcialmente escrito.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
