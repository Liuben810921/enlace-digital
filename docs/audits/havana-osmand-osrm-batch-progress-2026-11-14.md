# Continuación cartográfica de ENLACE DIGITAL — 14-11-2026

## Implementación
Se añadió `tests/havana-public-route-batch-isolated.cjs`, que compone los contratos ya existentes `delivery-osrm-integration-contract-isolated.cjs` y `delivery-route-validation-isolated.cjs`. Evalúa exclusivamente lotes de 8 a 12 rutas sintéticas, coordenadas WGS84 declaradas verificadas, puntos marcados como referencias públicas, procedencia/versión/caducidad de OSRM y comparación contra distancia de referencia OsmAnd. Una discrepancia, ausencia de ruta o falta de procedencia conserva `pending_confirmation`.

La prueba `tests/havana-public-route-batch-isolated.test.cjs` cubre aceptación ficticia, cardinalidad, ID duplicado, privacidad, versión, caducidad y discrepancia. Incorporada al workflow `isolated-delivery-quote.yml`. No se ejecutan consultas de red ni se crean rutas reales.

## Archivo OsmAnd proporcionado como evidencia visual
El usuario confirmó en capturas que dispone en su teléfono de `Carribean-archipelago-all_centralamerica.obf` (~676 MB), exportado de OsmAnd mediante un archivo OSF/ZIP. **El archivo binario no se ha subido ni inspeccionado en GitHub**; no asumir que puede importarse a OSRM. La comparación manual de distancias con OsmAnd es posible sin exponer el archivo ni datos personales.

## Pendientes
1. Verificar resultado de GitHub Actions del commit que incorpora la prueba.
2. Ejecutar rutas reales solo cuando exista motor OSRM gratuito accesible, extracto OSM verificable y entorno sin coste; no declarar precisión cartográfica antes de medir.
3. Para un mapa visual interactivo, aún falta una capa de representación (tiles/estilo y política de atribución), independiente del motor de rutas.
4. Para cobros reales, faltan backend autoritativo, origen efectivo, seguridad, persistencia y autorización de staging. Mantener checkout inactivo.

## Explorador móvil de referencias públicas — avance
- GitHub Actions anteriores #43662002731 y #43662002708: trabajos funcional, visual móvil y Chromium accessibility completados con éxito; no se repitieron manualmente.
- `tests/fixtures/delivery-warehouse-mobile-demo.html`: se incorporó esquema SVG interactivo sin teselas externas ni geocodificación, con cuatro puntos **inventados expresamente**, selección de origen/destino mediante selectores y controles SVG activables con teclado, reinicio y estado accesible. **No es un mapa geográfico real** y no representa rutas ni kilómetros. El texto y el estado comercial conservan «Tarifa pendiente de confirmar».
- `tests/delivery-warehouse-mobile-demo.test.cjs`: aserciones estáticas de controles, ausencia de peticiones HTTP y sintaxis del script. El workflow existente determinará aceptación final.
- Para evolucionar a mapa real faltan datos viales OSM/teselas con atribución, motor OSRM ejecutable, rutas verificadas y un renderizador que use geometría OSRM. No dibujar segmentos rectos como si fueran rutas viales ni publicar cotizaciones comerciales.
