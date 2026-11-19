# Desactivación informada de almacenes y proveedores — 2026-11-19

Base `0edc300aa8379e6b48707116f43bab5c828b27a8`. Implementaciones `5b3962dbdc3c678e3d527f3180d0691b451aa560` y `fe31323fa4a841b00cc2b3096498e571c815886d`.

## Funcionalidad operativa
- Antes de desactivar un almacén con productos asociados, se informa el número de productos afectados y se solicita confirmación. Cancelar conserva el estado y evita escrituras.
- Antes de desactivar un proveedor, se informa cuántos almacenes del proveedor dejarán de ser elegibles y cuántos productos distintos están asociados a ellos. Los productos asociados a varios almacenes se cuentan una sola vez.
- Si el mapa de asociaciones tiene registros no-array, se bloquea la desactivación hasta revisar su consistencia.
- Los cambios confirmados utilizan la persistencia e invalidación de contexto existente; no activan servicios.

## Verificación focalizada — PASS
Funciones reales extraídas de `index.html` con datos ficticios: almacén con 2 productos, cancelación = cero escrituras y estado activo; aceptación = una escritura y estado inactivo. Proveedor con 2 almacenes y 2 productos distintos (uno asociado a ambos): cancelación = cero escrituras y estado activo; aceptación = una escritura y estado inactivo. No se realizaron pruebas generales.

## Bloqueantes y pendientes
La persistencia sigue siendo local a un navegador; sincronización compartida y conflictos multiadministrador pendientes. Rutas viales verificadas, tarifa real y validación visual móvil pendientes. Batería integral reservada para autorización. La desactivación no elimina ni reasigna automáticamente productos: sus asociaciones se conservan para permitir reactivación o reasignación posterior.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
