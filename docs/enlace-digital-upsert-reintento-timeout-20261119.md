# Reintento tras commit remoto incierto — 2026-11-19

Base `75aa347335e8543c2b2842361980c90e57f1046a`; corrección `a7a0a1fd05529aca99b0244e2188a5c2c687a8aa`.

## Defecto reproducido
Se ejecutó la función real `edQueueInventory()` extraída de `index.html` con una dependencia `edApi` simulada. El primer `POST` guardó el registro ID 42 en el servidor ficticio y después lanzó `timeout after commit`. El segundo intento volvió a enviar `POST` simple y recibió `duplicate key`. Resultados previos: `false`, `false`; un registro remoto simulado.

## Corrección
Para productos nuevos, se utiliza `POST /rest/v1/productos?on_conflict=id` con `Prefer: resolution=merge-duplicates,return=minimal`. La ruta `PATCH` de productos existentes no cambia.

## Prueba posterior (PASS)
Con el mismo timeout posterior al commit ficticio: primer intento `false`, segundo `true`, dos llamadas `POST` con resolución de conflicto y exactamente un registro remoto ficticio (ID 42).

## Limitaciones
La compatibilidad de la restricción única `id`, los permisos de actualización en el servidor, la idempotencia de carga de fotos, los efectos de un timeout en `edSaveSupplierAlias`, las carreras concurrentes y la recuperación después de reiniciar navegador están **PENDIENTE**. No se realizaron consultas reales a Supabase ni pruebas integrales. No se ejecutaron GitHub Actions, staging, producción, pedidos reales, descargas, despliegues ni costos.
