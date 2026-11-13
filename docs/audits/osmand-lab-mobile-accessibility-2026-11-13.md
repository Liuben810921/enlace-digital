# Revisión de compatibilidad móvil y accesibilidad — Laboratorio OsmAnd

Fecha: 13 noviembre 2026. Rama: `audit/delivery-map-readonly-20261113`.

## Auditoría y correcciones
- Se añadieron asociaciones explícitas `label for` / `input id` en identificador, ruta, distancias, disponibilidad y JSON.
- Los campos de kilómetros usan `inputmode=decimal`, manteniendo tipo numérico y restricciones de rango.
- Los resultados se presentan en tabla con `caption`, encabezados de columna y fila y región desplazable `tabindex=0` para navegación por teclado en pantallas pequeñas.
- Se añadió región de estado con `aria-live=polite` y errores específicos de importación, con enfoque del campo cuando está disponible.
- Se corrigió una ruta residual de importación que usaba `localStorage.setItem` sin manejo de excepción; ahora emplea el guardado validado.

## Pruebas
`node tests/delivery-route-lab-ui.test.cjs` comprueba semántica de formulario, atributos de accesibilidad, mensaje ante JSON inválido y conservación de matriz cuando falla el almacenamiento.

GitHub Actions: https://github.com/Liuben810921/enlace-digital/actions/runs/43493558553 — success.

## Limitaciones
La verificación es estática y automatizada en Node/VM; no constituye una inspección visual en Android/iOS ni una auditoría WCAG integral. La rama no está desplegada en producción. Se recomienda validación visual manual en pantalla estrecha antes de integrar. Sin servicios externos, Supabase ni pedidos reales.
