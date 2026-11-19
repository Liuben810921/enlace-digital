# Recuperación de asociaciones tras reinicio simulado — 2026-11-19

## Alcance
Código real extraído de `index.html`: `edDeliveryIsQuarantined`, `edDeliveryRecoverQuarantine` y `edDeliveryContextInvalidate`, ejecutados con `localStorage` simulado. Sin navegador ni servicios externos.

## Escenario (PASS)
Estado persistido: cuarentena `q=1`, almacén propio activo `a`, asociación del producto 7 al almacén `a`, revisión de contexto 4. Se simuló reinicio con `edDeliveryQuarantinedInSession=false`.

1. `edDeliveryIsQuarantined()` tras reinicio: `true` (bloqueo persistido).
2. `edDeliveryRecoverQuarantine()`: `true` después de validar asociaciones.
3. `edDeliveryIsQuarantined()` después de recuperar: `false`.
4. Revisión del contexto: `4 → 5`, invalidando cotizaciones previas.
5. Asociación `{\"7\":[\"a\"]}` conservada exactamente.

No se reprodujo defecto en este escenario; sin modificación del código.

## PENDIENTE
Recuperación cuando el guardado de asociaciones quedó parcialmente confirmado, reinicio real del navegador, concurrencia entre pestañas/dispositivos, persistencia de fotografías tras reinicio y coherencia transaccional entre producto/alias/almacenes. Requiere pruebas adicionales; la batería integral requiere autorización previa.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
