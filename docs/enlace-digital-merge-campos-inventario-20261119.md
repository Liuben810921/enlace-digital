# Persistencia de inventario y campos ajenos — pruebas focalizadas, 2026-11-19

Base verificada: f285b8c350778f33f307bb965fc04c8abd9257a7, rama plan/havana-osrm-benchmark-offline-20261114, sin commits posteriores al iniciar.

## Ejecución
Se ejecutó con Node.js v22.16.0 un prototipo sintético local de siete casos, todos con aserciones PASS (7/7). Su versión reproducible quedó en `tests/inventory-merge-fields-synthetic.test.cjs`. El modelo prueba una estrategia propuesta; **no** ejecuta la función real `edQueueInventory` ni Chromium.

Casos: preservar fees/categories modificados; preservar account; rechazar products ajenos; detectar modificación de products antes de la última lectura; incorporar fees cambiados antes de la última lectura; reproducir pérdida de fees escritos después de la última lectura; rechazar JSON malformado con parser defensivo.

## Hallazgos
El código operativo actual usa `JSON.stringify({...state,products:target})` y una comparación de toda la cadena previa. Si `state` está desactualizado, una escritura podría sobreescribir campos ajenos después de una carrera compare/write. En el modelo, leer estado completo inmediatamente antes de guardar, comprobar `products` contra la versión esperada y fusionar solo `products:target` conserva cambios ajenos visibles antes de la lectura final. También evita conflictos innecesarios ante cambios solo de fees/categories. Sin embargo, otra pestaña puede escribir después de esa lectura: la carrera persiste, y la pérdida queda reproducida.

## Recuperación
En conflicto detectable, no sobrescribir ni reintentar automáticamente operaciones remotas; mantener los datos locales y externos separados para reconciliación explícita. JSON corrupto debe causar fallo cerrado sin resetear ni sustituir almacenamiento. El prototipo no prueba persistencia de cola con lotes concurrentes reales ni consistencia del backend.

## Decisión
No modificar `index.html` todavía: la mejora propuesta carece de prueba de integración focalizada con el guardado real, sus fotos y las versiones de cola. Se requiere estudiar todos los escritores de `enlace_demo_v1` antes de desplegar una fusión de campos y probar la coordinación cooperativa. Web Locks nativo permanece PENDIENTE por bloqueo del origen seguro del navegador. No hay garantía de atomicidad con localStorage.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. No se ejecutó batería integral.
