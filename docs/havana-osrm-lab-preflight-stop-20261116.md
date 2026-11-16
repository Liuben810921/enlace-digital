# Laboratorio OSM/OSRM de La Habana — preflight y bloqueo verificable (16-11-2026)

**Base:** `7b44f053484b6719e1ce53481c0980631e432228`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`. Autorización limitada a preparar laboratorio gratuito, con obligación de detenerse antes de descargar/procesar si no se verifica procedencia, licencia, integridad, recursos y ausencia de costos. Sin GitHub Actions, cuentas, pagos, infraestructura persistente, despliegues ni sistemas operativos.

## Fuente pública consultada, sin descarga
- Página oficial de Geofabrik: https://download.geofabrik.de/central-america/cuba.html ; consultada 2026-11-16. Muestra `cuba-latest.osm.pbf` de **60 MB** aproximados y datos OSM hasta `2026-11-15T21:22:28Z`. Esta cifra es una descripción de página, **no bytes descargados ni checksum verificado**. La misma página enumera `cuba-261115.osm.pbf` (63,277,253 bytes) y archivo `.md5`, pero ninguno fue descargado.
- Condiciones oficiales de Geofabrik: https://www.geofabrik.de/data/download.html ; extractos públicos disponibles gratuitamente; datos derivados de OSM sujetos a ODbL 1.0, atribución y obligaciones aplicables. Gratuidad de descarga **no implica** costo cero de procesamiento o servicio.
- OSRM: https://github.com/Project-OSRM/osrm-backend ; motor BSD-2-Clause; secuencia MLD recomendada `osrm-extract`, `osrm-partition`, `osrm-customize`, `osrm-routed`. No se instaló ni ejecutó.

## Preflight del contenedor local (observado)
- Disco: sistema overlay de 32 GB, ~30 GB disponibles (`df -h /mnt/data`).
- RAM: total 5.8 GiB, ~4.6 GiB disponibles, sin swap (`free -h`).
- `osrm-extract`, `osmium` y `docker`: no instalados (`command -v` sin resultados).
- `getent hosts download.geofabrik.de`: sin resolución DNS.
- Sin PBF Cuba previamente descargado ni ejecutables OSRM aportados. No hay SHA-256 del archivo objetivo ni verificación de integridad real.
- La suficiencia de memoria y disco para OSRM no se puede afirmar sin procesar un extracto concreto y medir recursos; las cifras libres son capacidad observada, no benchmark.

## Puerta de ejecución y decisión
**STOP / NO-GO** antes de descarga y procesamiento: falta acceso al archivo, verificación de checksum, OSRM ejecutable y demostración de recursos suficientes/costo cero. No se debe activar una vía de pago ni GitHub Actions.

**Siguiente vía compatible con autorización:** aportar manualmente un extracto PBF fechado de Geofabrik y su checksum oficial, junto con un entorno/binario OSRM compatible y obtenido sin costo, para verificarlos primero en el contenedor aislado. Solo si se cumplen integridad, licencia y límites de recursos se procesarán 8–12 rutas entre puntos públicos, con pruebas de sentidos y `NoRoute`. El procesamiento no se autoriza automáticamente si alguno de los requisitos falla.

## Estado sin cambios
No se descargaron datos OSM, no se procesaron rutas, no se ejecutó OSRM, no se modificó el manifiesto `blocked_no_assets_downloaded`, ni se cambiaron código operativo o workflows. No se consultaron Supabase, staging, producción, clientes, proveedores reales ni pedidos. No se generaron costos.
