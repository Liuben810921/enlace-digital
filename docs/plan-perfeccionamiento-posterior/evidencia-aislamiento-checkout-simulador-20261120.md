# Evidencia focalizada — aislamiento del simulador y vista previa de entregas

**Fecha:** 2026-11-20  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `d773dd064943d38e237b5491abc519e380269ae3`

## Método

Se leyeron directamente de GitHub `index.html`, `experiments/havana-delivery-quote/quote.js` y `experiments/havana-delivery-quote/geoapify-offline.js`. Se ejecutaron en un runtime JavaScript V8 aislado las funciones **originales** `edDeliveryCheckoutPreview` y `edDeliveryQuoteDemo`, con sus dependencias reales de cotización y adaptador offline, sustituyendo exclusivamente DOM, localStorage, orígenes y destinatarios por dobles sintéticos. Sin navegador ni red.

## Resultados: 6/6 PASS

| Caso | Evidencia |
|---|---|
| Vista previa con producto 101 asociado a dos almacenes activos | `PENDIENTE`, fila `PENDIENTE`, razón `INCOMPLETE_ROUTES` |
| Simulación administrativa para destino de referencia y tarifa ficticia de 200 CUP/km | `SIMULACIÓN FICTICIA`; origen más lejano de los dos ejemplos: 5 km, 1000 CUP; texto explícito `NO ES TARIFA REAL` |
| Vista previa del mismo producto **después** de simular | Sigue `PENDIENTE`; sin campo `feeCup`; sin contaminación de la cotización |
| Comprobación administrativa sin distancias sintéticas | `PENDIENTE · ROAD_DISTANCE_MISSING` |
| Producto sin asociación | Fila `PENDIENTE` con `Producto sin punto de salida` |
| Asociaciones con JSON ilegible | `PENDIENTE` con `Asociaciones ilegibles` |

**Incidencia del arnés:** la primera ejecución creó un objeto DOM distinto en cada llamada a `getElementById`, impidiendo observar los mensajes del simulador. Se corrigió el doble de DOM para devolver el mismo elemento persistente y se repitieron los seis casos: 6/6 PASS. No se atribuyó este fallo al código de la aplicación.

## Inspección del flujo de compra

`edOfficialOrderPreview` invoca `edDeliveryCheckoutPreview(lines)` y presenta una sección de mensajería `PENDIENTE` que declara ausencia de rutas viales verificadas y de precio de mensajería. El checkout sigue marcado como modo prueba. Esta comprobación es **inspección estática** de esa integración, no prueba end-to-end en Chromium.

## Decisión

No se reprodujeron defectos funcionales en el alcance comprobado; **no se modifica código operativo**. Las distancias sintéticas se generan solamente en `edDeliveryQuoteDemo(true)` y no se transmiten a `edDeliveryCheckoutPreview`, cuyo contrato recibe `routes:[]`.

**PENDIENTE:** pruebas de interfaz real en navegador, proveedor vial autenticado, rutas reales, cotización operativa, persistencia compartida segura y atomicidad entre pestañas. No afirmar que el simulador constituye cotización real.

**Restricciones respetadas:** sin GitHub Actions, Supabase, staging, producción, pedidos reales, servicios externos, instalaciones, despliegues ni costos. No se repitieron las diez pruebas del adaptador Geoapify.
