# Pruebas focalizadas: cambio de proveedor/tipo y recuperación — 2026-11-19

Base: e332c7a113bc0ccfde51eaa108bcaf7c01494fd5. Rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical; cero commits posteriores.

## Correcciones
- edDeliveryOriginSave toma instantánea del JSON bruto de asociaciones cuando cambia tipo o proveedor del almacén y la comprueba de nuevo inmediatamente antes de persistir; cancela si cambió.
- edDeliveryRecoverQuarantine rechaza productos referenciados por asociaciones no vacías si no aparecen en el inventario cargado. Conserva la posibilidad de asociaciones vacías explícitas.

## Pruebas ejecutadas
Se extrajeron las funciones reales de index.html y se ejecutaron en arnés JavaScript con datos ficticios y almacenamiento simulado.

| Función | Escenario | Resultado |
|---|---|---|
| OriginSave | Cambio limpio de proveedor activo, sin productos asociados | PASS: 1 persistencia |
| OriginSave | Producto asociado al almacén | PASS: 0 persistencias |
| OriginSave | JSON corrupto | PASS: 0 persistencias |
| OriginSave | Asociaciones cambian entre lecturas | PASS: 0 persistencias |
| OriginSave | Formulario desactualizado | PASS: 0 persistencias |
| OriginSave | Proveedor de destino inactivo | PASS: 0 persistencias |
| RecoverQuarantine | Producto conocido y asociación válida | PASS: desbloquea |
| RecoverQuarantine | Producto desconocido | PASS: no desbloquea |
| RecoverQuarantine | Producto con lista de almacenes vacía | PASS: desbloquea |
| RecoverQuarantine | JSON corrupto | PASS: no desbloquea |
| RecoverQuarantine | Invalidación falla | PASS: no desbloquea |

11 escenarios sintéticos con resultados esperados. No se ejecutó caso independiente de cambio de tipo, ni pruebas con DOM/Chromium real.

## Limitaciones
El control de instantáneas de localStorage no garantiza atomicidad entre pestañas ni frente a escrituras posteriores a la última comparación. Pendiente: ensayos de cambio de tipo, recuperación con inventario incompleto, fallos de almacenamiento y validación móvil. Batería integral sujeta a autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
