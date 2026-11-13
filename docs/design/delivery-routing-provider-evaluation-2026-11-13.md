# Evaluación de motores viales para ENLACE DIGITAL — 13 noviembre 2026

## Decisión provisional
No conectar servicios externos ni usar un servidor público de demostración para cobros reales. El prototipo incorpora únicamente un adaptador compatible con respuestas OSRM, fixtures sintéticos y caché en memoria. No existe precisión verificada para La Habana.

## Alternativas
- **OSRM autoalojado:** código abierto, API Route/Table, datos OpenStreetMap; requiere servidor, actualizaciones OSM, configuración de perfiles, observabilidad y presupuesto de alojamiento. Servidor demo sin SLA y con política de uso restrictiva, no apropiado como dependencia comercial.
- **openrouteservice alojado:** planes publicados de 0 EUR con cuotas para Directions y Matrix, clave API y límites por minuto/día; comprobar condiciones comerciales, cobertura cubana, atribución y cuotas vigentes antes de elegir. Alternativa autoalojada con costos operativos.
- **GraphHopper:** motor abierto y API alojada; el plan Free se declara no comercial salvo condiciones/acuerdos específicos, por lo que no es opción comercial gratuita confirmada.
- **Valhalla autoalojado:** otra alternativa abierta OSM, más complejidad operativa. Servidor demo sujeto a uso razonable.

## Requisitos de seguridad y operación
- API keys solo en backend/Edge Function autorizada; nunca en JavaScript público ni GitHub Pages.
- HTTPS, cuota por usuario y rate limiting, caché por perfil, versión de datos, coordenadas y sentido origen→destino, TTL, límites de concurrencia y presupuestos.
- No almacenar domicilios exactos en registros de acceso; usar destinos de referencia. Proveedores y almacenes deben mantenerse privados a usuarios no autorizados.
- Fallar de forma cerrada: si la ruta no está disponible, mostrar «Tarifa pendiente de confirmar», nunca distancia euclidiana como distancia vial ni tarifa inventada.
- Conservar en cada cotización fuente de ruta, fecha, perfil, versión de mapa, punto de salida efectivo y parámetros de tarifa.
- Comprobar cobertura y restricciones viales con un conjunto de rutas reales en La Habana comparadas con OsmAnd, sin asumir igualdad de resultados.

## Estado de implementación
- Parser de coordenadas decimales OsmAnd en la interfaz aislada.
- Adaptador de respuesta OSRM-compatible sin llamadas de red.
- Caché sintética en memoria con TTL y claves que distinguen sentido y perfil.
- Selección explícita del almacén realmente usado y cálculo sobre la distancia vial mayor entre los usados.
- Pruebas automáticas en GitHub Actions. No integrado con pedidos ni Supabase.

## Fuentes consultadas
- https://github.com/Project-OSRM/osrm-backend
- https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server
- https://openrouteservice.org/plans/
- https://giscience.github.io/openrouteservice/hosted-api-restrictions
- https://www.graphhopper.com/pricing/
- https://www.graphhopper.com/terms/
- https://github.com/valhalla/valhalla
