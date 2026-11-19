# Carrera compare/write y persistencia por lotes — 2026-11-19

Base verificada: c84d3a3a7030f1470be03824a4912371cb7ecc66; rama plan/havana-osrm-benchmark-offline-20261114; comparación GitHub: identical (0 commits posteriores). Archivo inspeccionado: index.html, función edQueueInventory.

## Reproducción sintética focalizada (sin navegador ni servicios)
Intercalación determinista exactamente después de `localStorage.getItem('enlace_demo_v1')===expectedShared` y antes de `localStorage.setItem(...)`:
1. Estado inicial: products=[old], fees.delivery=1.
2. Comparación de la pestaña A: true.
3. Pestaña B escribe products=[other].
4. Pestaña A escribe products=[new].
5. Lectura posterior A coincide con su escritura: true.
6. Resultado: se pierde other, sin detección posterior. DEFECTO / LIMITACIÓN REPRODUCIDA de la estrategia compare/setItem.

El control posterior detecta solo una modificación que siga presente en el momento de la lectura. No detecta la escritura ajena ya sobrescrita. No existe CAS atómico nativo de localStorage. Ni relecturas adicionales ni storage events ofrecen exclusión mutua. No se introduce una falsa garantía.

## Campos ajenos a inventario
Con state.fees.delivery=99 al construir el lote, la expresión real `JSON.stringify({...state,products:target})` conserva 99: PASS sintético. Si otra pestaña altera fees en almacenamiento antes de la comparación, la igualdad de la cadena completa detecta el cambio: bloqueo conservador, sin pérdida en esa secuencia. Si la pestaña ajena altera fees después de la comparación y antes de la escritura, la actualización se pierde igual que en la carrera anterior: LIMITACIÓN reproducible. Si state se modifica durante la espera de la API, el spread de state al finalizar conserva sus campos actuales; no se verificó integración de UI.

## Recuperación y mitigación
Al detectar conflicto observable, no reintentar escritura ciegamente: conservar estado ajeno, mostrar error y exigir recarga/reconciliación. Para una carrera no observable ya sobrescrita, no se puede reconstruir con seguridad el valor anterior sin registro independiente. Un bloqueo advisory entre pestañas mediante Web Locks API, donde esté disponible, podría reducir carreras solo entre participantes cooperativos; requiere compatibilidad y pruebas específicas. Para garantías de concurrencia reales se necesita control de versiones transaccional del lado servidor y reconciliación de cambios; fuera del alcance autorizado.

## Alcance y decisión
Prueba sintética determinista, no Chromium ni prueba integral. No se cambia código operativo: no hay corrección local demostrable que cierre de forma atómica la ventana entre getItem y setItem. Se documenta la limitación y se mantiene pendiente validación de recuperación/compatibilidad en navegador. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
