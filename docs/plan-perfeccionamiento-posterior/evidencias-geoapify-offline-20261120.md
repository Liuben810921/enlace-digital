# Evidencias focalizadas Geoapify offline — 2026-11-20

Rama `plan/havana-osrm-benchmark-offline-20261114`. El punto de partida `34d1e44c805a245c61e521f824194e5d1b7b255d` tenía **un commit posterior**, el Archivo Maestro de Continuidad, que se conservó.

## Implementación

- `index.html` carga `experiments/havana-delivery-quote/geoapify-offline.js` después de `quote.js`.
- `edDeliveryCheckoutPreview` invoca `adaptGeoapifyRoutes` exclusivamente con `responses:[]`, IDs de orígenes del producto, destino ficticio y revisión actual. El resultado `PENDIENTE` se presenta en la fila. No se pasan distancias del adaptador al cálculo tarifario: `quoteProductDelivery` continúa recibiendo `routes:[]`.
- Sin `fetch`, API key, peticiones Geoapify ni tarifas reales. Se mantiene bloqueo fail-closed.
- Archivo de pruebas reproducibles `experiments/havana-delivery-quote/geoapify-offline.test.js`.

## Ejecución focalizada real

Se ejecutó localmente `node /tmp/geoapify-test.js` con Node.js `v22.16.0`, usando una copia literal del adaptador recuperado de GitHub y los mismos trece casos posteriormente incorporados al repositorio.

**Resultado observado: 13/13 PASS.**

Casos:
1. Fixture correcto -> `PENDIENTE`, 4.5 km sin verificar.
2. Dos orígenes -> dos rutas sin verificar.
3. Falta una respuesta -> `INCOMPLETE_ROUTES`.
4. Origen duplicado -> `ROUTE_SCOPE_MISMATCH`.
5. HTTP 429 -> `GEOAPIFY_RESPONSE_INVALID`.
6. `features:[]` -> `GEOAPIFY_RESPONSE_INVALID`.
7. Distancia negativa -> `GEOAPIFY_METRICS_INVALID`.
8. Distancia infinita -> `GEOAPIFY_METRICS_INVALID`.
9. Distancia mayor de 300 km -> `GEOAPIFY_METRICS_INVALID`.
10. Revisión negativa -> `INVALID_REVISION`.
11. Origen no solicitado -> `ROUTE_SCOPE_MISMATCH`.
12. Sin respuestas -> `INCOMPLETE_ROUTES`.
13. Fixture correcto nunca genera `feeCup` ni `COTIZACION_SIMULADA`.

**Límite de evidencia:** no se ejecutó Chromium ni prueba DOM dinámica de `index.html`; la integración de la vista previa se revisó por modificación textual focalizada, no se declara probada en navegador. Tampoco se realizó prueba de API real, autenticidad de respuestas, geocodificación ni distancias viales reales.

## Bloqueantes

Clave protegida en intermediario seguro, procedencia autenticada, presupuesto/cuotas, geocodificación de direcciones de La Habana, pruebas de rutas reales autorizadas, y control de revisión de datos. Persistencia compartida insegura y atomicidad entre pestañas siguen PENDIENTES.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos.
