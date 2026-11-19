# ENLACE DIGITAL — Protección funcional de asociaciones producto-almacén
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `52cabb205d6b8a1bc3e6e4930efe36d278b188da`; comparación inicial con HEAD: identical.

## Cambio de módulo
Las operaciones locales de proveedores, almacenes y destinos se consideran provisionalmente completas. No se declara terminada la cotización operativa: rutas viales reales y pruebas Chromium móvil siguen pendientes.

Se pasó al módulo **productos → puntos de salida**. En `edProductOriginsPanel`, un registro local de asociaciones no-array (por ejemplo `{"product-1":"malformed"}`) provocaba `TypeError: saved.filter is not a function` al editar el producto. Se reprodujo ejecutando la función exacta con dependencias ficticias.

## Corrección
El panel valida que las asociaciones del producto sean una lista de identificadores de texto. Si no lo son, muestra una advertencia de revisión sin modificar datos, en lugar de lanzar una excepción. No se cambió el almacenamiento ni se accedió a inventario real.

## Pruebas mínimas
`index.html` de GitHub, blob `e5fa6a108f390278c9325eb9caa89b9f2a18cc32`:
- Asociación malformada como texto: advertencia, sin excepción — **PASS**.
- Lista con elemento numérico: advertencia — **PASS**.
- Lista válida con almacén existente: casilla seleccionada — **PASS**.
- Lista vacía válida: formulario disponible — **PASS**.
- Sintaxis JavaScript inline completo, V8 — **PASS**.

Son pruebas funcionales aisladas con datos ficticios; no equivalen a pruebas móviles, de integración ni a batería integral. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. No se repitieron auditorías.
