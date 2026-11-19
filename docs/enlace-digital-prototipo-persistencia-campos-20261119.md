# Persistencia por campos: prototipo offline y rutas adicionales — 2026-11-19

Base 2a4e9fbd4573a28ec651fb7de25d0510e20c3c2a, rama aislada idéntica al inicio. Inspección de index.html, blob SHA bc167baf595fa3085009b421a12eac08438d1b86.

## Cobertura de escritores
Se localizaron ocho apariciones de `localStorage.setItem('enlace_demo_v1'`: edLoadCategories (línea 789), edLoadInventory (838), edQueueInventory (889), dos migraciones (905), **save() general (947)**, **guardado de banner (948)** y deleteProductForever (2662). Por tanto, la cobertura debe incluir también save() y banner. Los escritores de línea 905 son dos apariciones de una misma línea.

## Prototipo ejecutado
Se implementó y ejecutó en entorno JavaScript aislado una función `persist(storage,patch,expected)` que valida JSON y products, compara campos esperados, fusiona parche sobre estado compartido y verifica escritura. 7/7 aserciones PASS: preservación de products al guardar categories, preservación de categories al guardar products, rechazo de conflicto de products, preservación de fees al eliminar, dos lotes secuenciales, JSON inválido, y reproducción deliberada de pérdida de escritura externa posterior a última lectura. La séptima prueba es **demostración de vulnerabilidad**, no éxito de seguridad. Código reproducible añadido en `tests/storage-field-persistence-prototype.test.cjs`.

## Decisión y límites
No se cambió index.html: la función común aún no está integrada con las ocho escrituras ni validada en sus efectos reales; no garantiza atomicidad, y las operaciones remotas previas al guardado local requieren reconciliación. En particular, save() escribe estado completo **antes** de encolar, y el banner escribe estado completo; parchear solo carga/cola/eliminación/migraciones dejaría riesgos abiertos.

La prueba `tests/inventory-real-queue-focal.test.cjs` sigue pendiente de ejecución como archivo Node sobre una copia local exacta del HTML; la ejecución previa de cuatro escenarios de la función real se hizo mediante JS aislado, no con el archivo. Web Locks nativo sigue PENDIENTE. También quedan pendientes integración completa, pruebas de recuperación real y batería integral autorizada.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
