# Revisión persistente de contexto de entregas — 2026-11-19

Base: `6f8a872e3bfe847ba0468d5e16300a57913c9864`. Corrección: `7f8473097d279a18890bd1c7da9c315e73422c31`.

## Defecto reproducido
Se ejecutó la función real `edDeliveryContextInvalidate()` con `localStorage` simulado. La revisión persistida era 4 y `setItem` retornaba sin escribir. Antes de la corrección la función devolvía 5, pero el almacenamiento seguía en 4: falsa confirmación de invalidación de cotizaciones.

## Corrección
Se verifica inmediatamente que `getItem(ED_DELIVERY_CONTEXT_REV_KEY)` coincida exactamente con la nueva revisión. Si no coincide, se informa del error y se devuelve `null`.

## Pruebas posteriores (2/2 PASS)
- Escritura silenciosamente fallida: retorno `null`, revisión persistida 4.
- Escritura correcta: retorno 5, revisión persistida 5.

## Alcance y pendientes
Esta prueba no demuestra durabilidad tras cierre de navegador ni atomicidad de inventario, alias y asociaciones. Las pruebas de reintentos tras reinicio simulado con confirmaciones parciales de esos tres subsistemas, permisos reales de upsert, persistencia de fotos y concurrencia entre dispositivos siguen **PENDIENTE**. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral reservada para autorización previa.
