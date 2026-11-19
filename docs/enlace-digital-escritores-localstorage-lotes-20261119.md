# Escritores de enlace_demo_v1 y conflictos entre lotes — 2026-11-19

Base: 452370297643ad76e205fb07a48c2c46a8858261; comparación inicial de rama: identical. Inspección directa de index.html (SHA blob bc167baf595fa3085009b421a12eac08438d1b86).

## Inventario de escritores
- Línea 789: edLoadCategories escribe JSON.stringify(state) después de recibir departamentos.
- Línea 838: edLoadInventory escribe JSON.stringify({...state,products:loaded}).
- Líneas 888–890: edQueueInventory compara cadena completa, escribe {...state,products:target} y verifica.
- Línea 905: migración de categorías y reseteo inicial escriben state completo.
- Línea 2662: eliminación definitiva de producto escribe JSON.stringify(state).
- Línea 947 (fragmento de inicialización) y otras apariciones: revisar escrituras indirectas/agrupadas antes de afirmar cobertura exhaustiva. No se modifica código operativo.
- Líneas 1652 y 1684: transferencias de almacenes leen y validan products, no escriben esta clave en esos puntos.

## Pruebas sintéticas ejecutadas
Se ejecutaron **8/8 PASS** en Node.js v22.16.0 con un modelo local de los patrones de escritura, no con la función original extraída. Casos:
1. Escritura completa de categorías basada en state obsoleto pierde products de otra pestaña (riesgo reproducido).
2. Carga completa de inventario pierde categories ajenas (riesgo reproducido).
3. Eliminación completa pierde fees ajenos (riesgo reproducido).
4. Fusión del campo products preserva categories y fees ya visibles.
5. Fusión rechaza products cambiados externamente sin sobrescribir.
6. Dos lotes consecutivos con baseline actualizado guardan first y second.
7. Lote posterior con baseline obsoleto se rechaza.
8. Escritura no cooperativa después de última lectura continúa causando pérdida.

Las pruebas 1–3 son simulaciones de los patrones observados, **no** reproducción end-to-end del navegador ni de las rutas remotas. PASS en 1–3 y 8 significa que el riesgo fue reproducido intencionalmente, no que el sistema sea seguro.

## Diseño y recuperación
Una estrategia de fusión por campos debe cubrir **todos** los escritores de enlace_demo_v1 y preservar los demás campos leyendo la versión compartida vigente. Inventario requiere comparación de versión de products y baseline por lote, y gestión explícita de carga/eliminación. El guardado en cola hace operaciones remotas antes de persistir localmente; en conflicto no puede prometer rollback remoto. No repetir ciegamente API; retener cambios locales y datos externos separados, informar conflicto y requerir reconciliación.

La lectura y escritura de localStorage no son CAS atómico; Web Locks coordina solo clientes cooperativos. Validación nativa de Web Locks PENDIENTE (origen seguro bloqueado en prueba previa). No se cambia index.html: parche parcial de un escritor sería insuficiente, y falta ejecución focalizada del código real de todos los escritores. No se ejecutó batería integral.

Restricciones respetadas: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
