# Siguiente bloque pendiente — viabilidad OSM/OSRM para La Habana (revisión offline)

Fecha: 2026-11-15. Base: `9fb60dde805aa16da4dc235135a0095fa50ca44a`. Alcance: solo revisión de documentos y manifiesto, sin descargas, ejecución OSRM, CI, despliegues ni costos.

## Fuentes inspeccionadas
- `docs/havana-osrm-coverage-benchmark-offline-plan.md` (ZIP de rama aislada adjuntado por propietario).
- `docs/audits/havana-osrm-offline-acceptance-and-real-route-plan-2026-11-14.md`.
- `docs/audits/havana-real-routing-preflight-2026-11-14.md`.
- `docs/design/delivery-routing-provider-evaluation-2026-11-13.md`.
- `tests/fixtures/havana-offline-cartography-manifest.json` consultado en GitHub al commit base.
- `docs/havana-25-toctou-final-test-review-20261115.md` consultado en GitHub al commit base.

## Dictamen de prioridades y dependencias
| Orden | Bloque / riesgo | Evidencia actual | Puerta de salida | Estado |
|---|---|---|---|---|
| P0 | Fuente y licencia del extracto OSM | Manifiesto: `sourceUrl=null`, `sourceSha256=null`, `downloadedAt=null`; ODbL indicada como pendiente de revisión específica | Proveedor, URL, fecha, términos, atribución y obligaciones de redistribución documentados | BLOQUEADO |
| P0 | Costos totales | Sin proveedor, tamaño ni hardware medidos; software abierto no implica infraestructura gratuita | Presupuesto verificado de transferencia, disco, RAM, CPU, hosting y mantenimiento; prohibición de compromisos de pago | BLOQUEADO |
| P0 | Cobertura y conectividad | `coverageBounds=null`; ninguna vía o sentido real validado | Polígono GeoJSON WGS84 aprobado, márgenes, puntos públicos sintéticos y metodología de cobertura por municipio | BLOQUEADO |
| P1 | Entorno OSRM reproducible | No hay dataset local autorizado ni benchmark real | Versión/imagen por digest, `car.lua` por SHA-256, recursos disponibles, límites y rollback | NO EJECUTADO |
| P1 | Validación de rutas reales | Existen contratos y fixtures sintéticos; no rutas reales certificadas | >=200 pares sintéticos versionados para cobertura y 8–12 rutas públicas comparadas con referencia independiente | NO EJECUTADO |
| P1 | Interfaz móvil y privacidad | SVG sintético sin tarifas; falta fondo de teselas reales | Atribución visible, cero solicitudes externas no autorizadas, accesibilidad, validación de procedencia en backend | NO EJECUTADO |
| P2 | Cobro comercial | `commercialQuoteEnabled=false`; sin backend vial real | Aprobación independiente de cotización, origen/destino/versiones/TTL y fail-closed | NO-GO |

## Dependencias y secuencia sin gastos
1. **Ahora, solo documentación:** preparar ficha de evaluación de fuentes potenciales sin afirmar disponibilidad, precios, licencias de terceros, cobertura ni checksum. Preparar checklist de hardware local y coste de oportunidad. El polígono de La Habana y los puntos de control deben aprobarse antes de uso; no inventar coordenadas.
2. **Tras autorización independiente de consulta pública:** contrastar condiciones vigentes de fuentes, tamaño, licencia/ODbL, redistribución y capacidad de procesamiento. Consultar no equivale a descargar.
3. **Tras autorización adicional de descarga:** obtener PBF de procedencia confirmada, SHA-256, cobertura y registrar inventario; si cualquier costo es incierto, detenerse.
4. **Tras autorización separada de procesamiento:** OSRM aislado con límites, corpus sintético >=200 pares, benchmark 100 calentamientos + >=1000 consultas × 3 × concurrencias 1/4/16, medición RAM/CPU/disco y fallos. Los umbrales del plan son **provisionales**, no resultados observados.
5. **Solo con resultados reales y aprobación comercial:** decidir integración con backend confiable, sin confiar en `trustedBackend` del navegador, y mantener tarifas pendientes ante `NoRoute`, timeout o versión inválida.

## Decisión de arquitectura provisional
OSRM autoalojado + datos OpenStreetMap sigue siendo **candidato preferente**, no solución elegida definitivamente. Valhalla, openrouteservice y GraphHopper requieren reevaluación de costos, licencias, cuotas, cobertura y condiciones comerciales; ninguna alternativa se declara gratuita ni habilitada. No utilizar demo pública para cálculo comercial.

## Riesgos residuales
Calidad de red vial y sentidos en Cuba desconocidos; puentes/túneles y componentes desconectadas; recursos de preprocesamiento y alojamiento sin dimensionar; licencia de proveedor concreto no verificada; eventual diferencia entre base OSM y ruta de referencia; actualizaciones/versionado; privacidad de destinos; ausencia de backend autoritativo; UX y accesibilidad con teselas offline todavía no probadas. Los 25 PASS TOCTOU prueban el verificador y casos adversariales delimitados, **no** validan mapas ni distancias viales.

## Estado inalterado
`status=blocked_no_assets_downloaded`; `networkRequestsAllowed=false`; `commercialQuoteEnabled=false`; campos de fuente, checksum, cobertura y teselas nulos. NO-GO para descarga, procesamiento, servicios, despliegue, rutas reales y tarifas. No se ejecutaron pruebas nuevas ni GitHub Actions, no se descargó cartografía, no se accedió a Supabase, staging o producción y no se generaron costos.
