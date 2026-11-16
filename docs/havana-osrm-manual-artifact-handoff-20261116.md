# Entrega manual segura de artefactos para laboratorio vial de La Habana — 2026-11-16

Base verificada: `7df1bc12443dc85424b84a7af55dab13659e6ba9`. Rama `plan/havana-osrm-benchmark-offline-20261114`. **Solo instrucciones y preflight; ninguna descarga, instalación, procesamiento o servicio ejecutado.**

## Estado local reconfirmado
`df -h /mnt/data`: ~30 GB disponibles; `free -h`: ~4.7 GiB disponibles, sin swap. No aparecen `osrm-extract`, `osrm-routed` ni `docker` en PATH. `getent hosts download.geofabrik.de` no devuelve dirección. La RAM y disco disponibles **no acreditan** por sí solos suficiencia para preprocesar el extracto. No hay PBF de Cuba incorporado.

## Entrega manual mínima, sin cuentas ni pagos
**Paso 1 — PBF y comprobante:** En un equipo con acceso a Internet, abrir manualmente la página oficial `https://download.geofabrik.de/central-america/cuba.html`. Elegir un archivo **fechado** `cuba-YYMMDD.osm.pbf` si la página lo ofrece y obtener su archivo **correspondiente** `.md5` del mismo nombre; no mezclar con `cuba-latest.osm.pbf` que cambia con las actualizaciones. Conservar URL exacta, fecha de descarga, tamaño y texto de licencia. La página fue consultada anteriormente, pero la existencia y tamaño actuales del par concreto deben comprobarse al obtenerlo. No introducir direcciones privadas.

**Paso 2 — integridad:** En el equipo de origen, verificar que el checksum oficial `.md5` corresponde a los bytes del PBF; **MD5 de proveedor no equivale a SHA-256**. Calcular también SHA-256 local del mismo archivo para fijar la identidad exacta del artefacto, sin inventar valores. Ejemplos (ejecutar solo en el equipo que ya posee los archivos):
- Linux: `md5sum cuba-YYMMDD.osm.pbf` y `sha256sum cuba-YYMMDD.osm.pbf`; contrastar el MD5 con el texto oficial.
- Windows PowerShell: `Get-FileHash .\cuba-YYMMDD.osm.pbf -Algorithm MD5` y `Get-FileHash .\cuba-YYMMDD.osm.pbf -Algorithm SHA256`; contrastar el MD5 con el texto oficial.
- macOS: `md5 cuba-YYMMDD.osm.pbf` y `shasum -a 256 cuba-YYMMDD.osm.pbf`.
Si el MD5 no coincide, **STOP**. Registrar que MD5 detecta errores accidentales, pero no es garantía criptográfica fuerte frente a manipulación deliberada; exigir además procedencia HTTPS oficial y SHA-256 local de referencia.

**Paso 3 — adjuntar:** Compartir en esta conversación el `cuba-YYMMDD.osm.pbf` y el `cuba-YYMMDD.osm.pbf.md5` (o el nombre exacto ofrecido), más URL, fecha y SHA-256 calculado. Si el cliente de chat no acepta PBF, comprimir **sin modificar el contenido** a ZIP y adjuntar junto con el comprobante; la extracción será solo tras verificación del archivo y autorización vigente. No subirlos al repositorio GitHub.

**Paso 4 — motor OSRM:** No descargar binarios de sitios aleatorios ni solicitar claves. Para Linux compatible, aportar un paquete/imagen OSRM de fuente oficial `https://github.com/Project-OSRM/osrm-backend`, identificando versión/tag, arquitectura, sistema operativo, URL de procedencia y SHA-256; confirmar que contiene `osrm-extract`, `osrm-partition`, `osrm-customize` y `osrm-routed`, así como perfil `car.lua` y dependencias. Un enlace al código fuente **no equivale** a un binario ejecutable. No se presupone Docker instalado, compatibilidad binaria, ausencia de dependencias, disponibilidad de imagen sin cuenta ni costo de compilación. **Si no se dispone de paquete OSRM ya compatible y gratuito, mantener STOP** y evaluar una vía local gratuita autorizada antes de instalar nada.

## Comprobaciones pendientes tras adjuntar (sin ejecutar todavía)
1. Validar nombre, tamaño, extensión y origen; inspección segura de archivo/ZIP y hashes del PBF contra comprobante y SHA-256 comunicado.
2. Validar licencia ODbL, atribución y restricciones de distribución del origen específico; identificar versión de OSRM, perfil de automóvil y licencias de software.
3. Comprobar arquitectura, librerías requeridas y presupuesto de RAM, CPU, disco y duración de preprocesamiento, con límites que eviten agotar el entorno. Confirmar explícitamente costo cero.
4. **Solo si todo es conforme y dentro de la autorización**, planificar el procesamiento aislado y 8–12 pares entre puntos públicos, sin usar clientes ni proveedores reales. No afirmar rutas verificadas hasta medirlas.

## Límites
Sin GitHub Actions, cuentas, pagos, infraestructura persistente, servicios externos, cartografía descargada por este asistente, Supabase, staging, producción, pedidos, cambios operativos ni despliegues. Estado: **STOP hasta entrega e inspección de artefactos**. Cero rutas reales medidas. No se modificó el manifiesto de cartografía ni se añadió memoria geográfica.
