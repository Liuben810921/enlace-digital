# Ejecución Node focalizada, verificación de identidad — 2026-11-19

Rama: plan/havana-osrm-benchmark-offline-20261114. Al inicio la comparación con ae10d8da3c144f7a2fe3ae37f39321c8048ca620 mostró **ahead 1**; se preservó el commit posterior que contiene docs/enlace-digital-ejecucion-11-escenarios-20261119.md. No se reescribió historia.

## Ejecución real con Node
Se reconstruyó localmente **sin descarga** el contenido de `tests/storage-writer-integration-focal.test.cjs` recibido por el conector GitHub, en `/mnt/data/enlace-focal/tests/storage-writer-integration-focal.test.cjs`. Se comprobó la identidad exacta mediante `git hash-object`: `c5ab84377f4a048effd4fe81a5971f545b00e792`, coincidente con el blob SHA que devolvió GitHub.

Comando: `node /mnt/data/enlace-focal/tests/storage-writer-integration-focal.test.cjs`. Node v22.16.0. Resultado **11/11 PASS**, salida individual de los 11 casos, exit code 0. Casos: carga categorías, carga inventario, conflicto de cola, dos lotes, eliminación, migración categorías, reseteo migración, save general, banner, JSON inválido y carrera no cooperativa.

**Advertencia esencial:** el último caso pasa porque reproduce deliberadamente la pérdida de una tarifa durante una escritura intercalada. 11/11 no acredita seguridad de concurrencia. El archivo prueba un modelo, no ejecuta los ocho escritores de index.html.

## Cola real e integración
Se verificó vía conector que `index.html` mantiene blob `bc167baf595fa3085009b421a12eac08438d1b86`, tamaño 383516 caracteres. No se materializó una copia exacta completa en el entorno Node; por tanto `tests/inventory-real-queue-focal.test.cjs` **no fue ejecutado independientemente con Node**. La ejecución anterior del cuerpo real de la cola mediante JavaScript aislado permanece como evidencia separada, no debe confundirse con esta ejecución Node.

Las ocho rutas operativas siguen pendientes de prueba integrada y recuperación segura, especialmente efecto remoto previo a conflicto local, save() general y banner. La función común todavía no resuelve carreras no cooperativas entre lectura y escritura. Web Locks nativo PENDIENTE. Por ello **no se modifica index.html**.

No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, gastos ni batería integral.
