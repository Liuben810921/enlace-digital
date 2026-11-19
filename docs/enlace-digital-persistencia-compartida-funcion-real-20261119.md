# Persistencia compartida: función real y diseño común — 2026-11-19

Base 5a396885feadeb5fba57a381c6c128d3155e678c, rama plan/havana-osrm-benchmark-offline-20261114, sin commits posteriores al iniciar. Fuente: index.html SHA bc167baf595fa3085009b421a12eac08438d1b86.

## Evidencia ejecutada
Se extrajo y compiló la función **real** `edQueueInventory` de index.html en un entorno JS aislado mediante `new Function`. Las dependencias `edApi`, `edToken`, fotos y `localStorage` fueron simuladas, sin red ni navegador. Se ejecutaron cuatro casos:
1. Guardado normal: true, products actualizados, pending=0.
2. Cambio ajeno de fees después de API simulada: false, fees=99 preservados, products anteriores intactos; API ya fue invocada.
3. Cambio ajeno de products después de API simulada: false, products externos preservados.
4. Dos lotes encolados de la misma pestaña: segundo true, resultado final 'second', dos operaciones API simuladas, pending=0, snapshot='second'.
Se añadió `tests/inventory-real-queue-focal.test.cjs` para reproducir estos cuatro escenarios desde el checkout offline usando Node. **No se ejecutó el archivo Node en esta sesión**; las cuatro ejecuciones se hicieron directamente sobre la función extraída en el entorno JS de herramientas.

## Escritores del mismo estado
- edLoadCategories línea 789: escritura completa.
- edLoadInventory línea 838: escritura completa.
- edQueueInventory línea 889: escritura completa después de CAS no atómico.
- Migraciones línea 905: escritura completa.
- Inicialización adicional alrededor de líneas 947–948: revisar cadenas largas de inicialización para otras escrituras.
- Eliminación definitiva línea 2662: escritura completa.
La validación de transferencia de almacenes lee products en líneas 1652/1684.

## Diseño común propuesto, aún NO implementado
Una única rutina para escritura por campos: lectura y validación estricta de JSON existente, comprobación de versión/huella del campo afectado, fusión del parche en el objeto compartido más reciente, escritura, verificación posterior, resultado tipado de conflicto. Los guardados de cola requieren versión esperada de products por lote, con actualización de baseline únicamente tras éxito. Las cargas de inventario y categorías deben verificar que no sobrescriben modificaciones locales pendientes; la eliminación requiere coordinación con la cola y comprobación de products inmediatamente antes de persistir. Migraciones requieren marcas de versión y fallo cerrado ante JSON corrupto.

Una sola rutina no crea atomicidad: un escritor ajeno puede intervenir entre lectura y escritura. Web Locks nativo sigue PENDIENTE por bloqueo del origen seguro; el bloqueo solo serviría para escritores cooperativos. Para recuperación, conservar ambos snapshots, no reintentar operaciones remotas automáticamente tras un conflicto y exigir reconciliación. La API remota simulada ya se ejecutó en los casos de fallo local; no prometer rollback.

## Decisión
No se modifica index.html todavía: el defecto de sobrescritura por estado completo está reproducido en modelos, pero no se ha probado la integración completa de los seis escritores ni la coordinación con cargas/eliminación y sus efectos remotos. Cambiar solo la cola sería un parche parcial. Rutas no verificadas: migraciones, cargas, eliminación, escritura concurrente no cooperativa y compatibilidad nativa de Web Locks: **PENDIENTE**.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
