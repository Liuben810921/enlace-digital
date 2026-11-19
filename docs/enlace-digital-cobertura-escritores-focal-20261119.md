# Cobertura focalizada de todos los escritores — 2026-11-19

Base d2ab1ed806624b2e2e8ff5839563418476f0f773, rama aislada idéntica al inicio; index.html blob bc167baf595fa3085009b421a12eac08438d1b86.

## Pruebas realmente ejecutadas
Se extrajo directamente `edQueueInventory` de index.html y se ejecutó con mocks JavaScript, sin red: 3 casos PASS (normal, cambio externo de fees, cambio externo de products). En ambos conflictos se preservó la escritura externa y la función devolvió false, pero la API ficticia ya había sido invocada una vez; no se garantiza reversión de efectos remotos. La prueba preparada `tests/inventory-real-queue-focal.test.cjs` **no fue ejecutada independientemente con Node**, porque no se materializó el index.html exacto en el entorno de archivos. No atribuirle un resultado de ejecución.

Se diseñó y añadió `tests/storage-writer-integration-focal.test.cjs`, con 11 aserciones focalizadas para el modelo común: carga de categorías, carga de inventario, cola con conflicto, cola con dos lotes, eliminación, migración de categorías, migración de reseteo, save general, banner, JSON corrupto, carrera con escritor no cooperativo. **El archivo se añadió al repositorio, pero no se ejecutó con Node en esta sesión**. El último escenario debe demostrar pérdida intencional, no seguridad.

## Resultado y decisión
Se identificaron ocho escrituras de la misma clave: edLoadCategories, edLoadInventory, edQueueInventory, dos migraciones, save(), banner, eliminación definitiva. El helper de prueba valida estado, compara huellas de campos, fusiona parche y verifica la escritura. Su diseño reduce sobrescrituras visibles, pero no resuelve la ventana entre lectura/escritura; Web Locks nativo sigue PENDIENTE y solo coordinaría escritores cooperativos. Las rutas que hacen API remota antes de la escritura local necesitan reconciliación explícita; no reintentar automáticamente.

No se modificó index.html: no hay pruebas integradas de las ocho rutas reales ni del comportamiento de migraciones y efectos remotos con el helper. No se debe presentar el prototipo como corrección operativa. Pendientes: ejecutar archivos de pruebas Node con copia exacta del HTML, integración real y validación de recuperación, Web Locks nativo, batería integral bajo autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
