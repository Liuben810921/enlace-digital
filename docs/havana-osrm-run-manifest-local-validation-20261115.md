# Manifiesto reproducible OSRM: esquema y evidencia offline (2026-11-15)

Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base `c432f097f3ad41a0e09e1d0e56a7ae859201fa9b`.

## Esquema obligatorio de cada corrida
`run_id` (único), `phase` (extract/partition/customize/routed/routes), `osrm_version` (versión semántica numérica), `profile_sha256`, `input_sha256`, `image_digest` (sha256), `source_url` (https), `source_license`, `exit_code` (0–255), `wall_seconds`, `cpu_seconds`, `peak_bytes`, `disk_bytes`, `route_ms` (latencias de muestras sin PII).

Validación fail-closed: esquema exacto, números finitos no negativos, bytes enteros, hashes hexadecimales, sin claves JSON duplicadas, sin identificadores de corrida repetidos, máximo 16 MiB por archivo, 10 000 corridas y 100 000 muestras por corrida. Percentiles nearest-rank: `ceil(p*n/100)` sobre valores ordenados. Una fase de rutas exitosa exige muestras; una corrida fallida no puede presentar latencias exitosas. Se calcula SHA-256 del archivo JSON bruto para trazabilidad.

## Pruebas locales ejecutadas
Se crearon y ejecutaron **archivos locales** `/mnt/data/osrm_manifest/manifest.py` y `test_manifest.py` con Python stdlib; 22 pruebas en modo normal y 22 en `-O`, **todas PASS**. Hashes locales:
- manifest.py SHA-256 `af7b23740745d2acb9a74ddcbba6945560fc05ddbc04b7888be9e5d050d85ce7`; Git SHA-1 local `c301dd440f4125a02451f394c98f328ef1084eca`.
- test_manifest.py SHA-256 `34379d935c6aff00520e99f190e3d2ffb9eb3d12672ff40d93efa5aa28c60a42`; Git SHA-1 local `a451ce99440da83f358662c2228391680eda9e0b`.

**Limitación:** los dos archivos de prueba se encuentran en el entorno local, no en este commit de GitHub. No afirmar identidad con blobs remotos de estos archivos hasta materializar y comparar bytes exactos. Los artefactos existentes en GitHub `measure_v2.py` y `test_measure_v2.py` siguen disponibles y sus SHA-1 fueron comprobados en la etapa anterior.

## Protocolo real pendiente
El manifiesto es para *registrar* futuras medidas, no para certificarlas: no contiene firma ni evidencia independiente de cgroups, RSS, disco, licencia, imagen ejecutada o timestamps. Se requiere instrumentación real, hashes de datos OSM autorizados, perfil exacto, imagen OSRM verificada, tres repeticiones por límite 1/2/4/8 GiB, fases separadas extract/partition/customize/routed, percentiles y errores de rutas. Nada de ello se ha ejecutado. `commercialQuoteEnabled=false`.

## Investigación de alojamiento: fuentes oficiales
- Oracle Always Free: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm documenta 2 OCPU/12 GB ARM, 200 GB de bloque, posibilidad de recuperar instancias inactivas y capacidad no garantizada. No elegir para empresa cubana sin elegibilidad contractual expresa; consultar política https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ .
- Google Cloud: https://docs.cloud.google.com/free/docs/free-cloud-features documenta e2-micro en tres regiones estadounidenses, 30 GB de disco persistente y 1 GB de salida mensual; exige cuenta de facturación y cobra excedentes. Elegibilidad de empresa cubana no confirmada. No aprobado.
- GratisVPS, Vyce, VPSFree.io: rechazados en auditorías previas por permanencia/recursos/garantías.
**Ningún proveedor externo aprobado para operación comercial cubana.** No se deduce que sea imposible encontrarlo.

## Restricciones
Sin cartografía descargada, OSRM real, cuentas, activación manual de Actions, pagos, servidores, Supabase, staging o producción. Solo pruebas offline locales y documentación en rama aislada. Los commits pueden disparar workflows preexistentes; no se comprobó.
