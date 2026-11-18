# Recepción y verificación de extracto Cuba 2026-11-14 — 2026-11-18

Base anterior: `dc3ddcf8fd255d6aef2e79c14783ebfc8044f365`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Evidencia local comprobada, sin procesar cartografía
Archivos adjuntados por el propietario a la conversación (no subidos a GitHub):
- `cuba-261114.osm.pbf`, ~61 MiB; `file` identifica OpenStreetMap Protocolbuffer Binary Format.
- `cuba-261114.osm.pbf.md5`, 54 bytes; contenido: `9290d1d1fe879af7171ccfba0c03362d  cuba-261114.osm.pbf`.
- `md5sum` local del PBF: `9290d1d1fe879af7171ccfba0c03362d` — **coincide**.
- `sha256sum` local del PBF: `0381a456adde5d9fa9c8bedf3971d40612375ecfa1ca8679c99a205f785970e4`.
- `df -h /mnt/data`: ~30 GB disponibles; `free -h`: ~4.6 GiB disponibles, sin swap.
- `osrm-extract` no está disponible en PATH.

El checksum adjunto es una evidencia de consistencia entre los archivos, no una validación independiente de autenticidad del servidor. El formato reconocido no prueba que el PBF esté semánticamente íntegro ni que La Habana tenga cobertura vial suficiente.

## Puerta siguiente
**STOP antes de procesamiento**: falta OSRM ejecutable compatible, verificación de sus dependencias, límites de recursos y costo cero; no se ha medido procesamiento ni rutas. Se puede preparar por separado un entorno OSRM local gratuito y de fuente oficial, pero no descargar, instalar, compilar ni procesar sin superar la puerta de seguridad y disponibilidad establecida.

No se usaron GitHub Actions, cuentas, servicios, pagos, infraestructura persistente, Supabase, staging, producción, pedidos ni despliegues. El manifiesto operativo y código permanecen intactos; no se subieron los 61 MiB de cartografía al repositorio.
