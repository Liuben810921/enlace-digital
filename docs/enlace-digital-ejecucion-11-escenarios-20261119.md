# Ejecución focalizada de 11 escenarios y cola real — 2026-11-19

Base ae10d8da3c144f7a2fe3ae37f39321c8048ca620; comparación con rama aislada: identical; index.html blob bc167baf595fa3085009b421a12eac08438d1b86.

## Resultados verificados
- Se recuperó el contenido exacto de `tests/storage-writer-integration-focal.test.cjs` mediante conector GitHub y se ejecutó su texto completo en el motor JavaScript aislado, proporcionando un sustituto mínimo de `require('node:assert/strict')` para las aserciones utilizadas. Resultado registrado: **11/11 PASS**. **No fue ejecución Node**, y el archivo de prueba sigue siendo un modelo de políticas de escritores, no integración del HTML.
- Se extrajo `edQueueInventory` directamente del HTML y se ejecutaron dos llamadas encoladas en el motor JS aislado con `edApi` simulada: segundo resultado true, products final 'second', dos llamadas API simuladas, pending=0.
- No se ejecutó `tests/inventory-real-queue-focal.test.cjs` como archivo Node: no se materializó una copia exacta del HTML en el contenedor. No se utilizaron descargas.

## Riesgos no resueltos
Las 11 pruebas incluyen demostración deliberada de pérdida ante escritor no cooperativo en la ventana lectura/escritura; 11/11 significa que se verificó el riesgo, no que se eliminó. La ejecución aislada de la cola tampoco cubre todas las rutas reales. Continúan ocho escrituras de `enlace_demo_v1` en index.html (cargas, cola, migraciones, save, banner y eliminación). No existe CAS atómico en localStorage; Web Locks nativo PENDIENTE por bloqueo del entorno. Las operaciones remotas pueden quedar aplicadas aunque falle la persistencia local; no se debe reintentar ciegamente.

## Decisión
Sin cambios en index.html: falta prueba integrada de la función común en todas las rutas reales, recuperación y compatibilidad. No se activaron servicios ni batería integral.

Restricciones: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
