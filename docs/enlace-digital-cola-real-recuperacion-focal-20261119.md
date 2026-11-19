# Verificación focalizada de cola real y recuperación — 2026-11-19

Base 55a97f7f05d22697876efdc5282962237937e36a; comparación con rama plan/havana-osrm-benchmark-offline-20261114: identical, ahead 0. index.html recuperado por conector GitHub, blob SHA bc167baf595fa3085009b421a12eac08438d1b86, 383516 caracteres. Archivo de prueba tests/inventory-real-queue-focal.test.cjs, blob b93d2dc505a698c4bb6e73db5542759261d14ec7, 3153 caracteres.

## Ejecución focalizada real
Se extrajo literalmente la función edQueueInventory del HTML recuperado y se ejecutó en JavaScript aislado con edApi/localStorage/edToken/DOM simulados, sin red. Cuatro casos:
- Guardado normal: true; products='new'; una API ficticia; pending=0.
- Edición externa de fees durante API ficticia: false; fees=99 conservado; products='old'; una API ficticia; pending=0.
- Edición externa de products durante API ficticia: false; products='foreign' conservado; una API ficticia; pending=0.
- Dos lotes consecutivos: true; products='second'; dos API ficticias; pending=0.

El archivo de prueba específico **no se ejecutó como archivo Node**: no se pudo materializar el index.html exacto completo en el entorno de archivos sin descarga. No confundir la extracción ejecutada con ejecución Node. No se repitieron las 11 pruebas Node previas.

## Ocho rutas inspeccionadas
Las ocho escrituras directas de enlace_demo_v1 continúan en index.html: edLoadCategories (789), edLoadInventory (838), edQueueInventory (889), migración de categorías (905), reseteo de catálogo (905), save() (947), banner (948), deleteProductForever (2662). Todas usan persistencia de estado completo o un objeto basado en estado completo. En eliminación se espera a la cola, pero después de DELETE remota se persiste estado completo. En la cola se ejecuta edApi antes de comprobar la coincidencia de almacenamiento local. La recuperación posterior a efectos remotos parciales **no está demostrada**.

## Decisión
No modificar index.html: la corrección transversal no está validada con ocho rutas reales ni reconciliación segura. Las pruebas del modelo común 11/11 PASS ejecutadas con Node en la fase anterior no implican atomicidad; una prueba confirma deliberadamente pérdida por escritor no cooperativo. Web Locks nativo PENDIENTE. Prueba independiente Node de cola PENDIENTE. No batería integral.

Restricciones respetadas: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
