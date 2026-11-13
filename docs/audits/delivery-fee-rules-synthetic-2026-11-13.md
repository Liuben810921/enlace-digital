# Pruebas integrales de reglas de mensajería — 13 noviembre 2026

## Alcance
Exclusivamente módulos Node aislados en la rama `audit/delivery-map-readonly-20261113`. No se ejecutaron rutas reales ni se modificaron Supabase, producción, checkout ni pedidos reales.

## Hallazgo confirmado y corrección
`tests/delivery-dispatch-isolated.cjs` aceptaba parámetros generales pero no recibía ni transmitía `specialFeeCup` y `freeShipping` a `quoteDelivery`. Por tanto, los planes de despacho con origen efectivo podían devolver tarifa normal pese a existir una tarifa especial o entrega gratuita. Se añadieron ambos parámetros con valores por defecto seguros y se transmiten al cotizador.

## Casos comprobados
- Dos almacenes efectivamente utilizados: el importe se calcula con el más lejano de los elegidos, sin incluir almacenes disponibles no seleccionados.
- Distancia menor que 3 km: mínimo de 600 CUP con parámetros sintéticos 200 CUP/km, 3 km y mínimo 600 CUP.
- Distancia 3,01 km: 602 CUP.
- Tarifa especial de 2.500 CUP y envío gratuito de 0 CUP, incluso cuando ambas reglas están presentes: prevalece envío gratuito.
- Tarifa especial negativa: se rechaza por configuración inválida.
- Distancia vial ausente para un origen efectivo: cotización no disponible.
- Motor simulado con `NoRoute`, respuesta ausente o distancia negativa: cotización no disponible.
- Caché offline: mantiene el resultado de tarifa especial y envío gratuito cuando las distancias se reutilizan.

## Evidencia
- Corrección: `12305f81b06da7694b3c26d01d556d6fdb4ebf4e`.
- Pruebas de despacho: `641378c13f557faab910612f1bae68ed6f053404`.
- Pruebas del adaptador y caché: `81325efb456e9fa66a9dd1b637fa282b17b238a8`.
- GitHub Actions: https://github.com/Liuben810921/enlace-digital/actions/runs/43494201230 — success.

## Riesgos pendientes
- Las reglas se aplican actualmente a nivel de cotización agregada; la precedencia comercial de tarifas especiales por producto, pedidos mixtos y productos voluminosos necesita especificación y pruebas antes de integrar.
- No se ha validado el perfil vial ni precisión en La Habana con rutas reales de OsmAnd.
- No hay servicio de rutas externo ni integración con pedidos. No debe habilitarse facturación automática basándose en estos fixtures.
