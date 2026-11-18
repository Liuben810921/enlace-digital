# OSRM local — compatibilidad y bloqueo de recursos (2026-11-18)

Base: `0100a4a628da9a2f39ea122fc3cc6fd96e6a4982`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Solo inspección del contenedor y documentación pública; **sin instalaciones, descargas, compilación, procesamiento, red vial ni servicios**.

## Archivo recibido
`/mnt/data/cuba-261114.osm.pbf` (~61 MiB), `/mnt/data/cuba-261114.osm.pbf.md5` (54 bytes). `md5sum -c` en `/mnt/data`: `cuba-261114.osm.pbf: OK`. SHA-256 recalculado: `0381a456adde5d9fa9c8bedf3971d40612375ecfa1ca8679c99a205f785970e4`. No se sube cartografía a GitHub.

## Recursos y compatibilidad observados
- Arquitectura `x86_64`, Debian GNU/Linux 13 (trixie), Python 3.13.5.
- `cmake 3.31.6`, `ninja 1.12.1`, `g++` y `git` disponibles.
- `osrm-extract`, `osrm-partition`, `osrm-customize`, `osrm-routed`, `docker`, `podman`, `brew`: ausentes de PATH.
- `free -h`: ~5.8 GiB total, ~4.7 GiB disponibles, **pero** `/sys/fs/cgroup/memory.max = 4294967296` bytes (**4 GiB de límite efectivo**); `memory.current` observado ~603 MB. No swap. No usar RAM reportada por `free` como presupuesto real.
- `df -h /mnt/data`: ~30 GB disponibles. `/sys/fs/cgroup/cpu.max = 400000 100000` (cuota de 4 CPU).
- `getent hosts github.com` sin resolución; no se intentó descargar dependencias.
- No se ha demostrado el pico de memoria/disco para OSRM sobre este extracto: **no es seguro afirmar viabilidad por tamaño PBF**.

## Opciones locales evaluadas
1. **Imagen oficial OSRM**, `ghcr.io/project-osrm/osrm-backend`: el proyecto documenta MLD (`osrm-extract`, `osrm-partition`, `osrm-customize`, `osrm-routed`), pero faltan runtime de contenedores, imagen y validación de compatibilidad y límites. No ejecutar.
2. **Compilar OSRM desde código oficial**: fuente https://github.com/Project-OSRM/osrm-backend, licencia BSD-2-Clause. Herramientas C++/CMake/Ninja presentes; dependencias y fuentes no disponibles localmente. La guía actual emplea vcpkg, descarga y compila dependencias. No compilar ni instalar sin verificarlas.
3. **Binario empaquetado Homebrew Linux x86-64**: fórmula https://formulae.brew.sh/formula/osrm-backend, potencial alternativa, pero `brew` ausente, dependencias no verificadas y origen/huellas de artefactos aún no fijados. No instalar.

Fuentes de documentación pública: https://github.com/Project-OSRM/osrm-backend/blob/master/README.md y https://formulae.brew.sh/formula/osrm-backend (consulta documental; no se descargaron ejecutables).

## Dictamen y siguiente alternativa segura
**STOP / NO-GO para ejecución OSRM en este contenedor** hasta disponer de binario/imagen oficial verificable y una evaluación del pico de memoria bajo límite de 4 GiB, sin costos ni instalaciones no autorizadas. La ausencia de red directa y runtime impide instalación automática reproducible aquí. Una alternativa segura es un laboratorio local gratuito en un equipo autorizado que ya disponga de Docker/OSRM y memoria suficiente, con límites y logs de consumo; transferir únicamente resultados de 8–12 pares públicos y manifiesto de procedencia. **No usar GitHub Actions ni API comercial**.

No se modificaron código operativo, manifiesto cartográfico, Supabase, staging, producción, pedidos ni workflows. No se generaron costos. Rutas reales medidas: **0**.
