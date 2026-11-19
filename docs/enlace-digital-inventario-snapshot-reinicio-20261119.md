# Reintento de inventario y cuarentena tras reinicio — 2026-11-19

Base `28f275d9e6dcfc0902eca5fbfc35d3b2930e7df3`; corrección `957fc357b582e6d95c3b3f713f52388a4e4c7162`.

## Defecto reproducido: referencia de inventario adelantada
Se ejecutó la función real `edQueueInventory` con producto ficticio ID 1, API simulada exitosa y `localStorage.setItem` lanzando `quota`. Antes: primer resultado `false`, pero `edInventorySnapshot` ya contenía el producto; segundo intento también `false` y solo hubo una escritura remota, por lo que no se reintentó la operación de producto.

## Corrección y prueba posterior (PASS)
Se desplazó la actualización de `edInventorySnapshot` después del guardado local. Primera ejecución: `false`, snapshot `[]`; al restablecer almacenamiento, segunda ejecución `true`, dos escrituras remotas ficticias en total y snapshot actualizado.

## Reinicio simulado de asociaciones (2/2 PASS)
Se ejecutaron las funciones reales `edDeliveryIsQuarantined` y `edDeliveryRecoverQuarantine` con almacenamiento ficticio y bandera de sesión reiniciada. Caso válido: cuarentena inicial activa, recuperación `true`, bloqueo desactivado y revisión 4→5. Caso asociación a almacén inexistente: recuperación `false`, bloqueo persistente y revisión 4 intacta.

## PENDIENTE
No se ha verificado recuperación integral tras cierre real del navegador, atomicidad entre alias/inventario/asociaciones, carreras entre dispositivos, permisos y persistencia reales de servidor, ni batería integral. No se alteraron otros módulos sin defecto reproducido. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
