# Ejecución focalizada de escritores reales — 2026-11-19

Base: 071d39fe66765d9231bc64ba91caf4963323ff3d; rama plan/havana-osrm-benchmark-offline-20261114 idéntica al iniciar. Fuente index.html, blob bc167baf595fa3085009b421a12eac08438d1b86.

## Ejecución local de pruebas de modelos
Node.js v22.16.0:
- `/mnt/data/ed_synthetic/writers.test.cjs`: 8/8 PASS.
- `/mnt/data/ed_synthetic/inventory-merge.test.cjs`: 7/7 PASS.
Son simulaciones de patrones, no ejecución de funciones del repositorio.

## Ejecución directa del código REAL extraído de index.html
Se extrajeron mediante delimitadores de función los cuerpos originales de `edLoadCategories` y `edLoadInventory`, compilados con `new Function` en un entorno JavaScript aislado. Se sustituyeron exclusivamente `edApi`, `localStorage`, DOM y auxiliares por mocks; no hubo acceso a servicios.

1. `edLoadCategories`: estado inicial products='old', categories='old'. Durante la respuesta API simulada, otro contexto cambia products='foreign' en almacenamiento. Al finalizar la función real, products vuelve a 'old', categories='new'. **Sobrescritura confirmada**.
2. `edLoadInventory`: estado inicial products='old', categories='old'. Durante la respuesta API simulada, otro contexto cambia categories='foreign'. La doble paginación devuelve una fila válida de producto propio. Al finalizar la función real, categories vuelve a 'old'. **Sobrescritura confirmada**.

El archivo `tests/inventory-real-queue-focal.test.cjs` fue inspeccionado en GitHub; **no se ejecutó como archivo Node en esta sesión** porque no se materializó una copia local exacta de index.html. En la fase anterior sí se ejecutaron cuatro casos sobre la función extraída en JS aislado. No afirmar que se ejecutó ese archivo.

## Diseño de función común
Propuesta: `edPersistFields(patch, expected)` que valide JSON, relea el estado compartido, compruebe huellas por campo, mezcle únicamente campos autorizados, escriba y verifique; devolver estado tipado de éxito/conflicto. Debe distinguir inventario cargado del servidor, departamentos, eliminación y migraciones. Las cargas requieren rechazar si existe edición local pendiente o cambio externo de products. La cola debe actualizar su baseline por lote solo tras éxito; ante conflicto remoto/local no reintentar automáticamente. La eliminación debe coordinar con la cola, comprobar products y preservar fees/categories. Migraciones deben ser idempotentes y fallar cerradas ante JSON corrupto.

La fusión sigue siendo vulnerable a escrituras ajenas entre lectura y escritura. Web Locks nativo PENDIENTE, y aun validado solo coordinaría clientes cooperativos.

## Decisión
No modificar index.html en esta fase: hay dos defectos reales confirmados, pero la sustitución transversal de escritores aún carece de verificación focalizada para eliminación y migraciones. Aplicar un parche parcial crearía una falsa garantía. Eliminación, migraciones, cola integrada con nueva función, recuperación posterior a operaciones remotas: PENDIENTE. Sin batería integral.

No se usaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
