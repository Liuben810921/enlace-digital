# Verificación de seguridad del manifiesto — 2026-11-14

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`
Commit inspeccionado: `5fa806cb60f8cdfbd40a8cc4ec92fd63302df9f7`

## Evidencia confirmada
- GitHub confirmó la existencia y el diff del commit indicado.
- Consulta de workflow runs vinculados al commit: lista vacía. Consulta de statuses: lista vacía. **No declarar CI aprobado.** La consulta de runs solo cubre ciertos eventos y no prueba que nunca existieran otras ejecuciones.
- En entorno local ya disponible se ejecutaron `node tests/havana-offline-cartography-manifest-isolated.test.cjs` y `node tests/havana-offline-cartography-manifest-isolated.cjs`, ambos PASS.
- **Limitación:** los archivos de prueba locales disponibles no son idénticos a los obtenidos desde GitHub; estos PASS no certifican el commit exacto.
- Revisión estática del commit: validación fail-closed para flags, procedencia, atribución, claves duplicadas, archivos mayores a 16 KiB, preflight fijo y errores de lectura. No sustituye una prueba CI de la versión exacta.

## Bloqueantes de CI y costos
- No se pudo verificar exhaustivamente la configuración efectiva de todos los workflows, sus `runs-on`, eventos, acciones externas, descargas y posibles servicios antes de ejecutar CI.
- GitHub Actions puede ejecutarse por eventos de push/PR; crear un PR para provocar CI sin revisar esos controles no es una alternativa segura.
- No se solicitó ni disparó ejecución manual; no se creó PR; no se descargaron extractos OSM ni se lanzó OSRM.
- Pendiente: revisar YAML exactos, confirmar exclusivamente runners estándar gratuitos, permisos mínimos, ausencia de endpoints externos y facturación adicional; entonces ejecutar solo las pruebas Node offline, sin contenedores ni servicios externos. Si cualquier condición no puede demostrarse, permanecer bloqueado.

## Gates
`assetReady=false`, `routeReady=false`, `quoteReady=false`. Sin autorización de datos reales, staging, producción, Supabase, clientes, pedidos, inventario ni despliegues.
