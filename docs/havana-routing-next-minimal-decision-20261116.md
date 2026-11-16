# Siguiente decisión mínima de rutas reales — 16 noviembre 2026

Base: `7a9f4025a23bb5ce7d69f74bf85b2e2bceab1664`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Revisión documental offline; sin nuevos servicios, descargas ni código operativo.

## Hallazgo nuevo: distinguir fuente conocida de fuente incorporada
Los documentos previos usan dos estados que parecen contradictorios pero no lo son:
- `docs/audits/havana-real-routing-preflight-2026-11-14.md` **ya identifica** Geofabrik como fuente pública de extracto de Cuba (`https://download.geofabrik.de/central-america/cuba.html`), con gratuidad de descarga y obligaciones ODbL documentadas en esa revisión histórica. Se citó tamaño aproximado de 59 MB en ese momento; **no es una medida vigente**.
- `docs/havana-next-block-osm-osrm-dependencies-no-cost-20261115.md` y `tests/fixtures/havana-offline-cartography-manifest.json` mantienen `sourceUrl=null`, `sourceSha256=null`, `coverageBounds=null` y `blocked_no_assets_downloaded`. Es correcto: **ningún extracto concreto ha sido obtenido, fechado, hasheado ni aceptado**.

**Conclusión:** no es necesario repetir la búsqueda conceptual de un proveedor para el primer ensayo. Geofabrik/OSM es candidato documental ya identificado; falta aceptar un artefacto específico y comprobar cobertura y recursos. No modificar el manifiesto con una URL o checksum supuesto.

## Ruta crítica más corta y sin gastos asumidos
1. **Vía preferida:** el propietario aporta al laboratorio aislado un `cuba-*.osm.pbf` de procedencia Geofabrik con fecha, URL de origen y SHA-256, y un entorno OSRM ya disponible y gratuito. Antes de procesar, comprobar integridad, licencia y límites de RAM/CPU/disco. No se requiere conectar checkout ni servicio externo.
2. **Alternativa:** workflow manual GitHub Actions solo si se verifica previamente la disponibilidad y elegibilidad de minutos gratuitos, y existe autorización expresa para ese workflow; el presupuesto cero no está acreditado actualmente.
3. Procesar únicamente en laboratorio aislado; evaluar 8–12 rutas entre puntos públicos (sentidos, periferia, `NoRoute`), contrastar con referencia independiente y registrar fecha, versión del mapa, perfil y distancias. Sin resultados reales, ninguna tarifa puede pasar de `PENDIENTE`.

## Autorización que falta
**Para la vía preferida:** autorización explícita para incorporar al laboratorio el PBF público de Cuba y el ejecutable/entorno OSRM, con prohibición de pagos, cuentas, APIs, infraestructura persistente, datos privados y despliegues. El propietario puede aportar los archivos manualmente, como hizo con el ZIP del proyecto. Antes de descargar o ejecutar, comprobar procedencia y recursos. Si se necesita usar GitHub Actions, se requiere una autorización distinta después de verificar minutos y costos.

## No realizado
No se consultaron páginas externas en esta continuación; la disponibilidad, tamaño, términos y gratuidad actual de Geofabrik no fueron reconfirmados en tiempo real. No se descargó cartografía, no se procesó OSRM, no se activaron servicios ni se ejecutaron rutas reales. No se accedió a Supabase, staging, producción ni pedidos. Sin modificaciones de código operativo, sin memoria geográfica nueva y sin costos.
