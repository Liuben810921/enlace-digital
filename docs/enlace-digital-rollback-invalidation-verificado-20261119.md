# Reintentos y rollback de asociaciones — 2026-11-19

Base: `2901081d4e41d2cac4966b1e89c412a0a747d4f2`. Corrección: `9bddb486d95ee231efae7bbe05105e7071b046e5`.

## Defecto reproducido
Se ejecutó la función **real** `edProductOriginsSave()` extraída de `index.html` con un `localStorage` simulado. Cuando `edDeliveryContextInvalidate()` devolvía `null` y el segundo `setItem` (rollback) retornaba sin persistir, el método devolvía `false` sin cuarentena, pero el valor almacenado seguía siendo la asociación nueva.

## Corrección y ejecución posterior (2/2 PASS)
Se comprueba con `getItem` que el valor restaurado coincide exactamente con el anterior; si no, se activa cuarentena. Escenario A: rollback persistido, mapa anterior restaurado, sin cuarentena. Escenario B: rollback no persistido, mapa nuevo permanece, cuarentena activada.

## Riesgos y pendientes
Reintentos del `POST` de productos después de un timeout con confirmación remota desconocida, idempotencia de alias privado, recuperación tras cierre del navegador y coherencia remota/local permanecen **PENDIENTE**. La corrección cubre exclusivamente la rama de fallo de invalidación de asociaciones; no demuestra atomicidad global. No se ejecutaron servicios remotos ni navegador, GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. La batería integral requiere autorización previa.
