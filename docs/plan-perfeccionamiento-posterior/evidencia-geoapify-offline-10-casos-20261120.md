# Evidencia focalizada: Geoapify offline — 2026-11-20

## Alcance y ejecución
Se cargó **el contenido real** de `experiments/havana-delivery-quote/geoapify-offline.js` desde la rama aislada (blob `9e5fc0f51adb707bd2529dc944b387cc3201bc01`) y se ejecutó su exportación CommonJS en un runtime JavaScript V8 aislado, sin `window`, HTTP, claves ni servicios externos. Se invocó `adaptGeoapifyRoutes` con fixtures sintéticos y aserciones. **10/10 PASS**. No se ejecutaron pruebas en Chromium, Node ni GitHub Actions.

| Caso | Aserción ejecutada | Resultado |
|---|---|---|
| 01 | Un origen, 4500 m → 4.5 km, ruta `unverified`, respuesta `PENDIENTE` | PASS |
| 02 | Dos orígenes completos → dos rutas `unverified` | PASS |
| 03 | Falta respuesta de un origen → `INCOMPLETE_ROUTES` | PASS |
| 04 | Respuesta duplicada de un origen → `ROUTE_SCOPE_MISMATCH` | PASS |
| 05 | HTTP 429 → `GEOAPIFY_RESPONSE_INVALID` | PASS |
| 06 | `features: []` → `GEOAPIFY_RESPONSE_INVALID` | PASS |
| 07 | Distancia negativa → `GEOAPIFY_METRICS_INVALID` | PASS |
| 08 | Revisión -1 → `INVALID_REVISION` | PASS |
| 09 | Origen no declarado → `ROUTE_SCOPE_MISMATCH` | PASS |
| 10 | Fixture válido jamás devuelve tarifa, ruta `verified` ni `COTIZACION_SIMULADA` | PASS |

## Integración existente verificada por inspección del código
`index.html` ya contiene `edDeliveryCheckoutPreview(lines)`, que llama a `window.EDGeoapifyOffline?.adaptGeoapifyRoutes` con `responses:[]` y entrega **siempre `PENDIENTE`**. El contrato `quoteProductDelivery` recibe `routes:[]`; no se transmiten distancias ficticias ni se genera tarifa real. La ausencia del adaptador también retorna `PENDIENTE`. Se verificó el código, **no** un flujo completo en navegador; no se duplicó esta integración.

## Límites y pendientes
- No se probó la interfaz completa, carga de scripts en navegador, geocodificación, servicio Geoapify ni procedencia autenticada de distancias.
- El simulador explícitamente ficticio del panel administrativo sigue separado del checkout.
- Geoapify real, claves, cuotas, intermediario seguro y rutas verificadas requieren autorización específica.
- Persistencia compartida localStorage y atomicidad entre pestañas: **PENDIENTE**.
- No hubo GitHub Actions, Supabase, staging, producción, pedidos reales, instalaciones, descargas, despliegues ni costos.
