# Plan de adquisición controlada de cartografía vial — La Habana
Fecha: 2026-11-20
Rama: `plan/havana-osrm-benchmark-offline-20261114`
Base verificada: `f1e82ca09c094c3ab82c558c26112649d2ccc5a7` (sin commits posteriores)

## Objetivo y límites
Preparar el proceso para obtener datos viales verificables, procesarlos localmente con OSRM y contrastar distancias. **Este documento no autoriza ni ejecuta descargas, instalaciones, despliegues, servicios externos, pedidos reales ni gastos.**

## Fuentes contrastadas por consulta de documentación pública
1. Principal: Geofabrik Cuba: https://download.geofabrik.de/central-america/cuba.html . Archivo `cuba-latest.osm.pbf`, ~59 MB según la ficha consultada. Cobertura del extracto: Cuba, que incluye La Habana; **no demuestra conectividad ni precisión vial en barrios específicos**. Su tamaño y fecha cambian; volver a verificarlos antes de obtenerlo.
2. Alternativa: BBBike Extracts https://extract.bbbike.org/ . Permite solicitar recortes en formato PBF; el tamaño depende del área y formato. No se ha solicitado ni comprobado un extracto concreto de La Habana. https://extract.bbbike.org/extract.html
3. No elegir un extracto continental (~755 MB) cuando existe uno de Cuba (~59 MB), salvo necesidad técnica documentada.

## Licencia y atribución
OSM está bajo ODbL 1.0. Se debe acreditar a OpenStreetMap y sus colaboradores, enlazar a licencia y analizar obligaciones de bases derivadas antes de distribución o publicación: https://www.openstreetmap.org/copyright . Geofabrik identifica también ODbL: https://www.geofabrik.de/en/data/download.html . La gratuidad de los datos no prueba que el procesamiento, alojamiento o operación sea gratuito.

## Procedimiento propuesto (NO EJECUTAR sin autorización separada)
1. Validar fecha, tamaño exacto, fuente HTTPS, integridad SHA-256 del archivo recibido y, cuando exista, suma de control publicada; registrar URL, timestamp y licencia en manifiesto.
2. Obtener `cuba-latest.osm.pbf` de Geofabrik. Evitar datos personales y archivos históricos innecesarios.
3. Verificar entorno y capacidad: Docker o binarios OSRM disponibles, espacio libre para PBF + archivos `.osrm.*`, RAM, CPU, tiempo de proceso y posibilidad de operar sin servicios de pago. **Recursos reales sin medir**; reservar margen y no fijar cifras ficticias.
4. Preparar grafo MLD para conducción con comandos documentados por OSRM, ejecutables solo tras autorización:
   - `osrm-extract -p car.lua cuba-latest.osm.pbf`
   - `osrm-partition cuba-latest.osrm`
   - `osrm-customize cuba-latest.osrm`
   - `osrm-routed --algorithm mld cuba-latest.osrm`
   Consultar sintaxis de la versión fijada en https://github.com/Project-OSRM/osrm-backend y https://github.com/Project-OSRM/osrm-backend/blob/master/docs/tools.md .
5. Consultar rutas de muestra en instancia **local aislada**; API OSRM utiliza coordenadas en orden longitud,latitud y devuelve distancia en metros. Comprobar trayectos dentro de La Habana, entre municipios, puntos cercanos, calles de un solo sentido, cruces de bahía, accesos no conectados y fallos de ajuste de coordenadas.
6. Comparar trazados con calles conocidas y revisar si la cobertura es suficiente para cotizar. Mantener sin cotización los casos no verificables; registrar fecha, versión del perfil de conducción, hash de PBF y artefactos, identificadores de rutas y pruebas.
7. Solo tras validación independiente, diseñar la incorporación controlada al cotizador; **no cambiar automáticamente** el bloqueo `ROAD_DATASET_NOT_TRUSTED` ni activar pedidos reales.

## Condiciones de aceptación
- Archivo y procedencia verificables, atribución y licencia resueltas.
- Grafo OSRM procesado sin errores, capacidad local medida, ruta y distancia real verificadas en zonas de operación.
- Respuesta `NoRoute`, errores de coordenadas, rutas desconectadas y datos desactualizados conducen a `PENDIENTE`.
- Pruebas focalizadas de kilómetros, mínimo 3 km, tarifa por km y tarifas especiales sin cobrar a partir de rutas ficticias.
- Aprobación independiente para pruebas integrales y eventual activación.

## Pendientes y decisiones
**BLOQUEANTE:** no se dispone de PBF local ni de grafo OSRM verificado; no se ha medido el uso de RAM/disco ni comprobado la cobertura calle a calle. **PENDIENTE:** persistencia compartida segura y atomicidad entre pestañas. Las mejoras de optimización logística y operaciones masivas permanecen en el plan posterior.

## Autorización siguiente, limitada
Solicitar permiso expreso **solo** para descargar el PBF de Cuba y comprobar integridad/tamaño en un entorno aislado; una autorización adicional será necesaria para instalar o ejecutar herramientas OSRM si no están ya disponibles. No asumir autorización de despliegues, producción o costos.
