# Alternativas sin costo para recuperar el PBF original de Geofabrik — 2026-11-20

Base: `9795b49ccb7889186007ab83416654cc238df072`; comparación inicial de rama `identical`. Investigación documental solamente: **no se descargó ningún PBF, no se instaló nada y no se ejecutó OSRM**.

## Evidencia pública y opciones

**A. URL oficial, preferida.** `https://download.geofabrik.de/central-america/cuba-latest.osm.pbf` y ficha `https://download.geofabrik.de/central-america/cuba.html`. Geofabrik confirma que sus extractos OSM son gratuitos y se actualizan normalmente a diario: `https://www.geofabrik.de/en/data/download.html`. La ficha de Cuba publicada muestra ~59 MB, pero ese número **no es el tamaño verificado del fichero descargado**. El bloqueo previo fue resolución DNS en el entorno de pruebas, no una prueba de que el servidor estuviera caído.

**B. Otro host de la misma organización.** Existe un índice Geofabrik accesible documentalmente en `https://download-ext2.geofabrik.de/index.html`; el dominio alternativo puede servir para diagnosticar conectividad, **pero no se ha comprobado que sirva exactamente el fichero `/central-america/cuba-latest.osm.pbf`, ni que sea un espejo oficial estable**. Antes de usarlo: comprobar página del país, HTTPS, redirecciones, certificado, tamaño, fecha y archivo de checksum; si no hay confirmación, volver a A.

**C. Descarga manual del archivo original en un equipo con red funcional.** Obtener exclusivamente desde la URL oficial de Geofabrik y trasladarlo a un entorno aislado, con nombre, URL final, fecha UTC, bytes y SHA-256 calculado localmente; el traslado requiere autorización operativa específica y el archivo debe mantenerse fuera del repositorio. No aceptar PBF de terceros como si fuese el original sin trazabilidad.

**D. Alternativa no prioritaria.** Un archivo histórico con fecha explícita desde el índice de Geofabrik puede permitir pruebas reproducibles, pero no debe presentarse como `latest` ni usarse para tarifar rutas actuales. No recurrir al extracto continental mucho mayor para resolver un bloqueo DNS del mismo dominio.

## Protocolo futuro de validación (NO EJECUTAR AÚN)

1. Verificar DNS y HTTPS del host escogido; rechazar certificados inválidos, redirecciones a dominios desconocidos y respuestas HTML en lugar de PBF.
2. Consultar metadatos HTTP (`Content-Length`, `Last-Modified`, `ETag`, URL final) y ficha oficial; registrar fecha de consulta.
3. Solo tras autorización específica, descargar a un directorio aislado y temporal, con límite de tamaño y sin credenciales.
4. Calcular `sha256sum cuba-latest.osm.pbf` localmente; registrar bytes y SHA-256. Si Geofabrik publica suma MD5 auxiliar, contrastarla como comprobación adicional, **no sustituir SHA-256 por MD5**.
5. Verificar cabecera y formato PBF con herramienta disponible y autorizada; no instalar software sin permiso. Mantener el archivo binario fuera de GitHub.
6. No procesar con OSRM ni activar rutas/tarifas hasta autorización independiente.

## Decisión y bloqueantes

El paso más eficiente es probar primero conectividad al host alternativo **solo para comprobar si ofrece el archivo exacto**, sin asumir que funciona; si no, recurrir a la descarga manual del archivo original desde el sitio oficial en una máquina con red habilitada. Los datos siguen **NO DESCARGADOS y NO VERIFICADOS**. Las distancias viales reales, tarifas y la persistencia compartida segura siguen **PENDIENTES**.

Referencias: `https://download.geofabrik.de/central-america/cuba.html`; `https://www.geofabrik.de/en/data/download.html`; `https://download-ext2.geofabrik.de/index.html`; `https://download.geofabrik.de/technical.html`.
