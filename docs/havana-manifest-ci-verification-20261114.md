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

## Ampliación de auditoría: runners y YAML
- Política oficial de GitHub: runners estándar alojados por GitHub en repositorios públicos son gratuitos; runners grandes se facturan incluso en repositorios públicos; almacenamiento de artifacts/cache puede generar cargos. Referencias: https://docs.github.com/en/billing/concepts/product-billing/github-actions y https://docs.github.com/en/billing/reference/actions-runner-pricing
- Se consultó búsqueda de código del repositorio para nombres de pruebas, `runs-on: ubuntu-latest` y `workflow_dispatch`; devolvió cero resultados y **no demuestra ausencia de YAML**.
- Se intentó leer los archivos `.github/workflows/{ci.yml,ci.yaml,test.yml,tests.yml,mobile-visual.yml,chromium-accessibility.yml,isolated-ci.yml,g4.yml,f6.yml}`; todos devolvieron 404. No se conoce el listado de nombres reales.
- La consulta de directorio mediante API pública no estuvo disponible desde las herramientas de lectura; tampoco hubo acceso a red desde el entorno local. No se ha inspeccionado exhaustivamente la configuración de workflows y por tanto **no se certifica runner gratuito, ausencia de red ni costo cero**.
- No se inició, reejecutó ni provocó intencionalmente ningún workflow; no se abrió PR. La modificación de este informe puede activar workflows automáticos si existieran triggers de push: no se dispone de confirmación de que eso no ocurra.
- Para desbloquear: obtener listado exacto de `.github/workflows` por acceso autorizado, inspeccionar cada YAML y acciones transitivas; comprobar `runs-on`, `on`, `permissions`, `services`, `container`, `uses`, comandos shell, `upload-artifact`, cache y llamadas de red; limitar ejecución a tests Node sin instalación ni red, runner estándar y almacenamiento nulo. Si no puede verificarse, mantener bloqueo.

## Auditoría adicional de inventario (sesión posterior)
- Se volvió a buscar el listado real de `.github/workflows` por el conector GitHub: las acciones disponibles permiten leer un **archivo por ruta exacta**, pero no enumerar directorios ni listar workflows. La búsqueda de código no devolvió nombres de YAML.
- Se intentó consultar el endpoint oficial `GET /repos/Liuben810921/enlace-digital/contents/.github/workflows` desde la herramienta web, pero la respuesta fue inaccesible. El entorno local tampoco pudo resolver `api.github.com`. **No existe inventario verificable**.
- La API oficial de GitHub sí dispone de `GET /repos/{owner}/{repo}/actions/workflows` para obtener las rutas reales, pero esa operación no está expuesta por el conector disponible: https://docs.github.com/en/rest/actions/workflows#list-repository-workflows
- Pruebas offline locales ejecutadas nuevamente: `node tests/havana-offline-cartography-manifest-isolated.test.cjs` = PASS; `node tests/havana-offline-cartography-manifest-isolated.cjs` = PASS. Hash SHA-256 local del validador: `68247c383488db75813de75b5c6acfd5d8cceba694ff183becaf344887f3fcdb`; hash local del test: `b04c7aa6c986dea2659debbaf5e9049f0506195358aa4c4e52b3db6545808573`. **Estas copias locales no están verificadas byte a byte frente al commit remoto; no equivalen a CI.**
- No se ha podido revisar `runs-on`, permisos, acciones de terceros, `services`, `container`, `cache`, `upload-artifact` ni llamadas de red para **cada** workflow. En consecuencia, no se cumple la condición previa para lanzar CI, y **no se ha iniciado CI manualmente**.
- Este commit documental puede desencadenar triggers automáticos de push no inspeccionados. No se afirma ausencia de ejecuciones automáticas ni costo real nulo sin evidencia de facturación.
- Próximo desbloqueo: acceso de solo lectura a listado real de workflows (API de GitHub Actions o listado de directorio) y lectura de cada YAML; solo después evaluar ejecución acotada y sin costos. Mantener los tres flags de preparación en falso.
