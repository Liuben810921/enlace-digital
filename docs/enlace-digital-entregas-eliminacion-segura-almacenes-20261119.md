# ENLACE DIGITAL — eliminación segura de almacenes
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada `e943fb0e4f6083e30a7b07c455ab9b3765359325`, comparación inicial identical.

## Funcionalidad implementada
El panel de Administración de entregas permite ahora eliminar un almacén o punto de salida. Antes de eliminarlo comprueba las asociaciones locales de productos (`edProductOriginsRead`): si un producto usa ese almacén, o si las asociaciones tienen un valor que no es una lista válida, bloquea la eliminación y recomienda reasignar productos o desactivar el almacén. Exige confirmación explícita, respeta la cuarentena y usa `edDeliveryPersistAndInvalidate` para actualizar la revisión local de cotización. No modifica inventario, checkout ni pedidos.

## Pruebas funcionales mínimas ejecutadas
Fuente GitHub `index.html`, blob `73245786ee47218730b565eca2ac859264fd3ed7`.
- Almacén sin productos asociados: eliminado; queda otro almacén, revisión invalidada y panel refrescado — **PASS**.
- Almacén asociado a un producto: no se elimina ni solicita confirmación — **PASS**.
- Asociaciones malformadas: eliminación bloqueada — **PASS**.
- Fallo simulado de persistencia: no se confirma eliminación ni se refresca panel — **PASS**.
- Cuarentena: no se elimina ni se modifica la revisión — **PASS**.
- Parser V8 del JavaScript inline completo: **PASS**.

Pruebas de función real con dependencias ficticias, no integración móvil ni Chromium. Las pruebas móviles siguen pendientes por bloqueo administrativo de navegación previamente documentado. La cotización real requiere distancias viales verificadas; no debe activarse sin ellas. La batería integral se reserva para antes de activación con autorización.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Sin repetir auditorías generales.
