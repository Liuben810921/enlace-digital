# Matriz documental de fuentes OSM Cuba/La Habana y presupuesto preliminar

Fecha de revisión: 2026-11-15. Base: `c272b3b999ce67ac1c4eefe898aa6da681e8cc68`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Fuentes primarias consultadas (solo páginas, sin descargar datos)
- Geofabrik Cuba: https://download.geofabrik.de/central-america/cuba.html
- Geofabrik servicio y licencia: https://www.geofabrik.de/data/download.html
- BBBike extractos: https://data.bbbike.org/osm/
- BBBike ayuda y solicitud: https://extract.bbbike.org/extract.html y https://extract.bbbike.org/extract-dialog/en/about.html
- OpenStreetMap licencia: https://www.openstreetmap.org/copyright
- OSMF atribución: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- Inventario de extractos OSM: https://wiki.openstreetmap.org/wiki/Extract
- OSRM documentación: https://github.com/Project-OSRM/osrm-backend/blob/master/docs/tools.md y https://github.com/Project-OSRM/osrm-backend/blob/master/docs/profiles.md

## Matriz de decisión
| Proveedor / vía | Cobertura declarada | Formato OSRM | Tamaño publicado o estimado | Condiciones y riesgos | Dictamen |
|---|---|---|---|---|---|
| Geofabrik Cuba | País completo; página indica expresamente que no existen subregiones Cuba | `.osm.pbf` directo; además SHP/GeoPackage que no son la entrada directa recomendada | Página consultada: ~59 MB PBF, ~122 MB SHP ZIP, ~123 MB GPKG ZIP; contenido OSM hasta 2026-09-28T20:23:05Z, según captura indexada; cifras no garantizadas al momento de descarga | ODbL 1.0; atribución; extraer después La Habana localmente; verificar checksum y cobertura | **1º para piloto documental** |
| BBBike extracción personalizada | Rectángulo o polígono seleccionado por el usuario, por tanto permite solicitar La Habana; no se verificó un extracto predefinido de esa ciudad | PBF; también OSM XML, GeoJSON, GPKG, SHP, MBTiles, PMTiles | Sin tamaño específico de La Habana confirmado; límite de archivo declarado 128–1500 MB según formato; servicio muestra estimación al configurar | Requiere nombre de área y correo, genera enlace por email; ODbL 1.0; verificar si condiciones particulares de uso/carga aplican | **2º para recorte específico** |
| OSM Overpass / extracción propia | Área seleccionada por consulta; límites y completitud de red a validar | XML/JSON/OSM, requiere conversión/normalización para OSRM | No medido; depende de consulta y límites del servicio | Riesgo de cuotas, timeout, relaciones incompletas y dependencias; evitar servicios públicos para extracción masiva | **Reserva técnica**, no primera opción |

**No se ha inspeccionado el contenido de ningún extracto ni se ha comprobado conectividad vial real.** Los tamaños son metadatos publicados, no archivos descargados. Geofabrik y BBBike publican acceso gratuito a extractos; ello **no** garantiza costo cero de red, equipos, procesamiento, hosting, mantenimiento o servicios de terceros.

## Requisitos de descarga futura (NO autorizada en esta fase)
1. Seleccionar proveedor y congelar URL, fecha, licencia, formato, alcance geográfico, método de checksum y versión de datos. La URL de descarga no debe consumirse sin aprobación separada.
2. Confirmar costo de transferencia, datos móviles, almacenamiento, procesamiento, hosting y futuras actualizaciones. No inferir costo cero del acceso gratuito.
3. Aprobar polígono de cobertura y márgenes de rutas de La Habana. No inventar coordenadas ni afirmar calidad vial.
4. Verificar SHA-256 **local después de descarga autorizada**; cotejar hashes del proveedor cuando estén disponibles, conservando procedencia y metadatos.
5. Preparar `osrm-extract` con perfil `car.lua` fijado por versión y SHA; elegir CH (extract/contract) o MLD (extract/partition/customize) según benchmark, sin ejecutarlo ahora.
6. Probar red vial, sentidos, restricciones, conectividad y pares públicos sintéticos; mantener tarifas comerciales fail-closed.

## Presupuesto preliminar sin asumir costo cero
Los siguientes valores son **supuestos de planificación**, no cotizaciones ni recursos medidos:

| Rubro | Fórmula / unidad de cálculo | Dato conocido | Incertidumbre / decisión |
|---|---|---|---|
| Acceso al extracto | tarifa proveedor por descarga | Geofabrik y BBBike anuncian descargas gratuitas | Revisar términos, límites y posibles servicios premium |
| Transferencia | MB descargados × costo por MB de la conexión | Geofabrik publicó ~59 MB PBF | Tarifa de red local y futuras actualizaciones desconocidas |
| Disco | PBF + intermedios OSRM + dataset de ejecución + copia de seguridad + teselas | Sin medición para Cuba | Reservar capacidad tras prueba autorizada; no extrapolar GB como cifra cierta |
| RAM y CPU | pico de memoria, núcleos × horas de preprocesamiento | Sin benchmark de Cuba | Evaluar hardware local y costo de oportunidad; OSRM requiere preprocesamiento |
| Alojamiento | servidor/mes × meses + tráfico + respaldos | Ningún servicio contratado | Coste mensual no confirmado; sin autorización para activar |
| Mapa móvil | generación y almacenamiento de teselas + tráfico + caché | No hay teselas reales | Verificar licencias y evitar solicitudes a servidores públicos |
| Operación | actualizaciones, control de versiones, monitoreo, validación de rutas | Sin carga observada | Asignar responsable y periodicidad antes de lanzamiento |

**Total financiero verificable: no disponible.** Fórmula futura: `total = adquisición + transferencia + preparación + almacenamiento + alojamiento + respaldos + operación`. No se presenta `$0` como total, ni se inventan precios o requisitos mínimos.

## Recomendación y puertas de decisión
- Preferir **Geofabrik Cuba PBF** para un primer ensayo controlado cuando haya autorización de descarga y procesamiento; BBBike como alternativa si se justifica recorte por polígono y correo.
- Mantener `sourceUrl=null`, `sourceSha256=null`, `downloadedAt=null`, `coverageBounds=null` y `commercialQuoteEnabled=false` hasta contar con evidencias reales.
- **NO-GO** para cartografía operativa y tarifas. ODbL exige atribución visible y condiciones aplicables a datos derivados; revisión legal específica antes de publicar.

## Restricciones respetadas
Solo consulta documental de páginas públicas y lectura del repositorio mediante conector GitHub. Ningún archivo OSM/PBF/teselas descargado, ningún OSRM ejecutado, ningún GitHub Actions activado, ningún acceso a Supabase/staging/producción, ningún despliegue ni gasto autorizado o generado.
