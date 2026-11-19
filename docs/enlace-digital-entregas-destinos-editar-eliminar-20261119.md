# ENLACE DIGITAL — Destinos de referencia editables y eliminables
Fecha: 2026-11-19. Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `bdedb5c46ea0b98fa53ffd624f06f704162951e6`, comparación inicial: identical.

## Funcionalidad completada
El panel de ubicaciones de referencia anteriormente permitía **solo añadir** destinos. Se añadieron botones **Editar** y **Eliminar** exclusivamente en filas de destinos, formulario con campos precargados, botón **Cancelar edición**, confirmación de eliminación y bloqueo de operaciones durante cuarentena.

Edición y eliminación usan `edDeliveryPersistAndInvalidate` para invalidar la revisión de cotización local. La edición conserva el ID existente; la eliminación retira el destino. Los almacenes conservan su flujo independiente. No se toca el checkout ni se generan tarifas reales.

## Verificaciones focalizadas
- `index.html` releído desde GitHub, blob `bdf2901ebc9ada8c338bcd143ac6f549bc32867f`.
- Parser V8 del script inline completo: **PASS**.
- Prueba funcional aislada con formulario y almacenamiento ficticios: editar destino `dest-1` de «A» a «B», conservar ID, registrar invalidación `destination_edited` y refrescar panel: **PASS**.
- Eliminar `dest-1`, registrar invalidación `destination_deleted` y dejar cero destinos: **PASS**.
- Simulación de fallo de persistencia para editar y eliminar: ambos devuelven false, no refrescan el panel y mantienen datos previos: **PASS**.

## Límites y siguiente trabajo
Pruebas funcionales **aisladas** con DOM y almacenamiento simulados; no se probó Chromium móvil ni la integración completa. La ejecución móvil sigue bloqueada por la política del navegador documentada en la intervención anterior. Las distancias viales reales no están disponibles, por lo que la cotización operativa debe seguir en `PENDIENTE`. La batería integral queda reservada para antes de la activación y requerirá autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Sin reabrir auditorías del ejecutor PostgreSQL.
