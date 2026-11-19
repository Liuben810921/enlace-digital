# Web Locks API y persistencia de lotes: evaluación focalizada — 2026-11-19

Base ecd5527535e5d84f872486c03e4f76dd9a21ed6e. Rama plan/havana-osrm-benchmark-offline-20261114: identical antes de trabajar. Código inspeccionado: index.html, edQueueInventory; sin navigator.locks.

## Evidencias
Archivo sintético reproducible añadido: tests/inventory-web-locks-synthetic.test.cjs (6 escenarios). Ejecución recomendada por operador en entorno offline con Node: `node tests/inventory-web-locks-synthetic.test.cjs`. **No se ejecutó este archivo Node en esta sesión**. Se ejecutaron cuatro simulaciones equivalentes en el entorno JavaScript de análisis: cambio externo antes de comprobación (detectado); intercalación tras comprobación (sobrescritura); preservación de fees en estado local (preservado); serialización cooperativa (segundo intento rechazado). 4/4 observaciones esperadas. No son pruebas de Chromium, Web Locks nativo, ni API real.

## Diseño evaluado
`navigator.locks.request('enlace-demo-inventory', async()=>{ /* revalidar shared, escribir, verificar */ })` coordina solo clientes cooperativos del mismo origen y contexto de almacenamiento compatible. No usar `ifAvailable` como si fuera garantía. Solicitudes de pestañas distintas se serializan bajo un mismo nombre de bloqueo. No resuelve conflictos de servidor ni escrituras de código que no adquiera el bloqueo. Un navegador sin Web Locks necesita ruta explícita de fallo cerrado o fallback documentado sin garantía; el fallback actual mantiene carrera compare/write.

## Recuperación
Conflicto detectable: no sobrescribir, conservar copia de trabajo en memoria, informar que operaciones remotas previas podrían haber sido aplicadas y exigir recarga/reconciliación. Evitar reintentos automáticos de API: podrían duplicar efectos. Escritura ajena sobrescrita antes de la lectura posterior: irrecuperable con la información local actual. Un registro duradero independiente podría ayudar al diagnóstico, no dar atomicidad.

## Campos ajenos al inventario
El código actual usa `JSON.stringify({...state,products:target})`: preserva cambios ya reflejados en `state` al construir el payload. Un cambio en almacenamiento no reflejado en `state` y producido antes del chequeo se detecta por igualdad de la cadena completa; cambios entre comparación y escritura pueden perderse, incluso si afectan fees/categorías y no products. La escritura completa de state provoca conflictos conservadores por cambios no relacionados. No se afirma aislamiento por campo.

## Decisión
No modificar index.html sin pruebas focalizadas del comportamiento real del navegador y compatibilidad: el mecanismo sería cooperativo y necesita que TODOS los escritores relevantes respeten el mismo bloqueo, además de un plan de fallback y reconciliación. Pendiente implementación condicionada a pruebas adicionales; no se ejecutó batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
