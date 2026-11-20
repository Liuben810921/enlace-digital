# Corrección del estado cartográfico — 2026-11-20

La investigación de descarga del archivo `cuba-latest.osm.pbf` no era necesaria para avanzar: el usuario ya había aportado `cuba-261114.osm.pbf` y `cuba-261114.osm.pbf.md5` el 18 de noviembre. Evidencia previa en commit `0100a4a628da9a2f39ea122fc3cc6fd96e6a4982`.

- MD5 registrado: `9290d1d1fe879af7171ccfba0c03362d`.
- SHA-256 registrado: `0381a456adde5d9fa9c8bedf3971d40612375ecfa1ca8679c99a205f785970e4`.
- Formato: OSM PBF. El archivo binario no se publicó en GitHub.
- **No se ha verificado que el archivo siga disponible en el entorno de ejecución actual**. No confundir la verificación histórica con presencia física actual.

## Bloqueante real

No es adquirir de nuevo cartografía: es disponer de un entorno apto para **procesar y alojar OSRM**, con recursos comprobados, y después validar distancias reales de La Habana. En evaluación anterior se observaron ~4 GiB de RAM efectivos y ~30 GB de disco; no había OSRM, Docker/Podman o binarios preparados. Son observaciones históricas, no mediciones del entorno actual.

## Próximo trabajo permitido

Investigar opciones de alojamiento y procesamiento, medir requisitos sin instalar ni ejecutar OSRM y preparar una propuesta de despliegue aislado para autorización específica. No usar demo público de OSRM para cotización de producción. Mantener rutas y tarifas reales PENDIENTES hasta verificar grafo, rutas y operación segura.

Los documentos recientes de intentos de descarga describen exclusivamente el bloqueo DNS de **aquel entorno**; no invalidan la existencia y verificación histórica del archivo entregado por el usuario. Persistencia compartida insegura y atomicidad entre pestañas siguen PENDIENTES. Sin instalaciones, descargas, GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos.
