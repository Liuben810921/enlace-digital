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

## Geometría OSRM offline y cierre de incidencia CI
- Workflow #43662148943: job funcional `132653601212` falló por `SyntaxError: Invalid regular expression` en `tests/delivery-warehouse-mobile-demo.test.cjs` (aserción de `keydown` mal escapada); visual `132653601432` **success**. Se corrigió la prueba sin alterar lógica de negocio, commit `dcedc89a`.
- Workflow #43662148994: `chromium-accessibility` job `132653601305` **success**; el job auxiliar de identificación seguía en progreso en la consulta.
- `tests/delivery-osrm-geometry-isolated.cjs`: nuevo parser puro de geometría OSRM GeoJSON LineString con validación de longitud/latitud, límite de puntos y distancia, salida SVG escalada al espacio disponible. No conecta servicios ni convierte puntos rectos en rutas reales: solo transforma geometría **ya proporcionada**. El esquema SVG es una representación sin teselas cartográficas, no prueba de precisión geográfica.
- `tests/delivery-osrm-geometry-isolated.test.cjs`: casos de geometría sintética válida, `NoRoute`, coordenadas inválidas, ruta demasiado corta, distancia negativa y rechazo de geometría no validada. Agregada a CI existente.
- **Bloqueantes reales:** falta extracto OSM verificado y motor OSRM disponible sin costo, respuesta auténtica de backend con `geometries=geojson`, control de procedencia/caducidad, capa de teselas offline con atribución ODbL, y pruebas móviles del trazado con datos reales. El parser no se conecta todavía a la vista móvil para no simular rutas como reales.

## Trazado sintético SVG (siguiente fase)
- CI #43662300940: `test` y `mobile-visual` success. CI #43662300923: `chromium-accessibility` y job auxiliar success.
- Explorador móvil: botón inicialmente deshabilitado para mostrar **solo** la geometría GeoJSON codificada en el fixture para el par público ficticio A→B. Comprueba etiqueta `SINTÉTICA · NO VIAL`, procedencia declarada de fixture, versión y fecha de fixture, estructura LineString, coordenadas y distancia antes de trazar; cualquier cambio de selección elimina la geometría. No se conecta a motor real y no muestra kilómetros al cliente. Tarifa sigue pendiente.
- Importante: `trustedBackend:true` dentro de un fixture local NO es autenticación de backend. Esta muestra no debe promoverse a producción ni emplearse para cotizaciones. Para geometrías reales se exigirá validación del contrato autoritativo fuera del navegador, con versionado, caducidad y coincidencia de origen/destino.
- Plan de capa offline: seleccionar un extracto cartográfico con licencia y atribución OSM/ODbL verificadas; generar o incorporar teselas **solo tras autorización y confirmación de costo cero**, con manifiesto de origen, cobertura, versión y hash; renderizar con vista local accesible; no consultar proveedores externos desde el navegador. Separar fondo cartográfico de ruta OSRM validada y conservar estados de error sin línea.
- Pruebas: CI estático del fixture y visual Chromium existentes; pendiente prueba automatizada específica de interacción del nuevo botón con teclado, zoom 200 % y captura visual del trazado sintético. No se afirma que esa interacción esté ya verificada en navegador.
