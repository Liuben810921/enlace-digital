# Validación cartográfica real de La Habana — verificación previa y bloqueo de ejecución (14-11-2026)

## Autorización y límites
El Owner autoriza consultar/descargar datos públicos OSM y validar 8–12 rutas públicas ficticias en laboratorio aislado, **solo si se confirma ausencia de costos, cuentas, API keys, infraestructura de pago y condiciones especiales**. No se permite tocar Supabase, staging, producción, clientes, proveedores reales, pedidos, inventario ni desplegar.

## Fuentes verificadas (consultadas, no descargadas)
- OpenStreetMap: https://www.openstreetmap.org/copyright — datos ODbL 1.0, atribución obligatoria y obligaciones según distribución.
- Geofabrik: https://download.geofabrik.de/central-america/cuba.html — extracto público `cuba-latest.osm.pbf` de Cuba, disponible gratuitamente; la página identifica tamaño aproximado 59 MB en la respuesta consultada, cifra variable.
- Geofabrik términos: https://www.geofabrik.de/data/download.html — descargas públicas gratuitas, normalmente actualizadas diariamente, sin nombres/IDs de contribuyentes en el extracto.
- OSRM: https://github.com/Project-OSRM/osrm-backend — motor BSD-2-Clause con rutas automóvil, no implica alojamiento gratuito.
- OSMF: https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ — licencia permite uso comercial sin tarifa de licencia; teselas/servicios de mapas sujetos a reglas distintas.

## Verificación de capacidad técnica y decisión de ejecución
- El contenedor de trabajo actual carece de `osrm-routed`, `osmium` y `docker`; dispone de Python con `networkx`, pero no de parser PBF instalado.
- Intento de conexión HTTPS al archivo público de Geofabrik desde contenedor: **falló por DNS / ausencia de acceso de red** (`NameResolutionError`). No se descargaron bytes ni se procesó una red vial.
- No se activaron runners adicionales de GitHub Actions para descargar datos/imagen OSRM, porque **no se ha verificado el presupuesto ni la elegibilidad de minutos gratuitos del repositorio**, y usar un runner para instalar/ejecutar el motor no cumple todavía el requisito de ausencia confirmada de costes. El hecho de que CI previa haya sido exitosa no demuestra que los minutos restantes sean gratuitos.
- **Resultado: 0/8–12 rutas reales medidas**. No inventar kilómetros, disponibilidad ni cobertura. La consulta de páginas de Geofabrik demuestra existencia de extracto de Cuba, no cobertura efectiva de calles, sentidos o rutas en La Habana.
- No se usaron servicios públicos de demostración de OSRM ni APIs de geocodificación para eludir requisitos de privacidad o términos de servicio.

## Plan reproducible tras resolver el bloqueo
1. Confirmar entorno local con conexión a Geofabrik y OSRM ya disponible, **o** autorización adicional para ejecutar un job manual de GitHub Actions tras comprobar minutos/costo = 0, descarga de extracto e imagen OSRM pública y condiciones.
2. Registrar versión, checksum y fecha del PBF, perfil automóvil y licencia; preparar grafo vial con OSRM offline.
3. Usar **puntos públicos**, no coordenadas inferidas de direcciones privadas: Parque Central, Plaza de la Revolución, Ciudad Deportiva, Universidad de La Habana, Parque Almendares, Castillo del Morro, Parque Lenin. Identificar entradas viales reales con cartografía descargada, no centros de edificios.
4. Ejecutar 8–12 pares incluyendo dirección inversa, centro/periferia y casos `NoRoute`; registrar coordenadas públicas, versión del extracto, ruta OSRM, distancia en metros, duración y evidencia de conectividad. Comparar contra referencia independiente cuando esté disponible; no declarar precisión validada sin ella.
5. Publicar CSV/JSON de resultados sintéticos y resumen de cobertura en rama aislada; si falla ruta o confianza, estado `Tarifa pendiente de confirmar`.

## Autorización concreta adicional necesaria
Solicitar al Owner **una** de estas alternativas:
- Aportar un archivo PBF de Cuba y binario/entorno OSRM desde un equipo autorizado con costo cero y sin datos reales, para ejecutar pruebas localmente.
- Autorizar un workflow manual aislado que descargue Geofabrik y ejecute OSRM en GitHub Actions, **solo después** de que el Owner confirme que el repositorio dispone de minutos gratuitos suficientes y que la imagen pública no exige cuenta, API key ni gasto. No se creará infraestructura persistente.

No se pide acceso a Supabase ni a staging o producción. Estado: **BLOQUEADO POR ENTORNO DE EJECUCIÓN Y CONFIRMACIÓN DE COSTOS**, no por falla de código ni licencia OSM.
