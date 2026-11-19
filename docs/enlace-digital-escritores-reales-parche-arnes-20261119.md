# Pruebas focalizadas de escritores y recuperación — 2026-11-19

Base 5bd0e55bc37c1e97641e9d06c21beaf821e8a1e9; rama idéntica al inicio; index.html blob bc167baf595fa3085009b421a12eac08438d1b86.

## Ejecución directa de código real (motor JS aislado, API ficticia)
Se extrajeron edLoadCategories, save() y saveHeroSettings de index.html. En los tres casos se preparó almacenamiento compartido con fees.delivery=99 y estado en memoria obsoleto con fees.delivery=1. La ejecución original de cada escritor restauró incorrectamente fees.delivery=1. Al simular en un arnés la sustitución de la escritura completa por un parche limitado a campos propios con baseline, se conservó fees.delivery=99 en los tres casos. En save() y saveHeroSettings se observaron dos invocaciones a funciones de cola ficticias, no a servicios reales.

La comparación evidencia el defecto de sobrescritura y la ventaja del parche por campos, pero **el parche se ejecutó separadamente en el arnés**, no dentro de las funciones reales. No se ha verificado aún una integración funcional de la modificación.

## Cobertura pendiente
edLoadInventory y ambas migraciones tienen escritura completa verificada por inspección y reproducciones anteriores, pero **no se ejecutaron en esta fase con helper integrado**. Tampoco se ejecutó la recuperación del gate dentro de edQueueInventory/deleteProductForever; los resultados anteriores corresponden a un gate externo. No se repitieron las 11 ni las 9 pruebas Node ya superadas.

## Decisión de seguridad
No editar index.html hasta disponer de pruebas focalizadas de integración real, baseline por campo, manejo de error tras remoto confirmado, reconciliación y bloqueo de escrituras de inventario. localStorage no tiene compare-and-swap atómico y Web Locks nativo continúa PENDIENTE. Los efectos remotos simulados no garantizan idempotencia real.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
