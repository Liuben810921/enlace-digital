# Integración de cotización pendiente en vista previa — 2026-11-20

Base `fcbf19f4c6f0f1d10ed9c383309557aeaa9f78b1`, comparación inicial `identical`. Implementación `2f131f1b2c3f3eeeb5761065a6bb8d67025a7018`, blob `96e901dcae5419c92fbe728a62af3e57f324d724`.

## Implementación

`edDeliveryCheckoutPreview(lines)` consume el contrato `window.EDOfflineQuote.quoteProductDelivery`, obtiene las asociaciones de cada producto, los almacenes y proveedores, y pasa **routes:[]** para impedir cualquier tarifa inventada. La función produce solo estado `PENDIENTE`, motivos y nombres de puntos de salida. `edOfficialOrderPreview` presenta esos datos en la vista previa simulada. No se habilitan pagos, pedidos reales ni cotización definitiva.

## Pruebas dinámicas focalizadas

Código exacto de función extraído de `index.html` y contrato exacto de `experiments/havana-delivery-quote/quote.js` ejecutados en V8 con DOM/almacenamiento simulado. **8/8 satisfactorias**: origen único, dos orígenes compatibles, asociación ausente, origen desconocido, IDs duplicados, mapa malformado, cuarentena y contrato no disponible. En todos los casos `status=PENDIENTE`, sin importe de mensajería.

## Límites

El destino real del cliente aún no se usa para verificar rutas; el adaptador utiliza identificador de marcador `checkout-unverified` y ninguna ruta, deliberadamente. La prueba fue de función, no navegador ni flujo integral. Distancia vial real, tarifa verificada y persistencia compartida segura siguen pendientes. No GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
