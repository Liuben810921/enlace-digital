# Selección múltiple de dependencias — 2026-11-19

Base 5943c6b8d08ecd447c489784c10559d76fff9c5e; comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Operación
Commit b46933a5032ed8fae6ada548c92d8fbe7f494203; index.html blob 27d634d90f48b9a2f17ee6cb2a73caf8512afdd2.

Se añadió edDeliverySelectionSet(panel,checked) y controles Seleccionar todos / Deseleccionar todos a los fieldsets de transferencia de almacenes entre proveedores y reasignación/desvinculación de productos. La función valida que el panel sea FIELDSET de las dos familias permitidas, respeta cuarentena, deshabilitación de panel y checkbox, y no escribe almacenamiento. Las operaciones finales siguen utilizando las selecciones y sus validaciones existentes.

## Verificación focalizada
Función real con fieldsets sintéticos:
- Selección/deselección de productos: actualiza dos casillas habilitadas; conserva casilla deshabilitada.
- Selección/deselección de almacenes: mismo comportamiento.
- Cuarentena: rechaza y no altera casillas.
- Fieldset deshabilitado: rechaza.
- ID de panel no autorizado: rechaza.
**5/5 comportamientos esperados**. Sintaxis de función y panel validada. No navegador ni batería integral.

## Límites
No se probaron transferencias o reasignaciones completas en navegador. Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE. Sin despliegue ni datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
