# Auditoría complementaria de dependencias CI y aislamiento — 2026-11-15

**Base:** dd189b8f37f0cf563e83b0a6e066e94091dc5d08  
**Rama:** plan/havana-osrm-benchmark-offline-20261114  
**Alcance:** lectura de archivos concretos; sin ejecutar jobs, sin activar workflows, sin llamadas a servicios externos.

## Archivos realmente verificados

- `.github/workflows/verify-storefront.yml`: blob `bc9bafc9247fb0387f17aae9221e12d6743990a7`.
- `tests/customer-order-flow.cjs`: blob `137e7474a147d53165d76be726e641c6dcd67aad`; 4 069 caracteres.

La prueba JavaScript local importa módulos integrados `node:fs`, `node:vm` y `node:assert/strict`, lee `index.html`, extrae funciones embebidas y simula peticiones mediante `edCustomerRequest` en un contexto VM. No se observan en ese archivo imports de paquetes npm ni una petición de red directa. **Esto no equivale a probar la inocuidad de todo `index.html` ni de todos los workflows.**

## Riesgos concretos en verify-storefront.yml

1. **No es CI offline:** el job `syntax` ejecuta tres `curl` contra una función Supabase. Los filtros `push`/`pull_request` pueden provocar esos accesos al actualizar archivos incluidos en las rutas.
2. **Diagnóstico con secreto:** `gmail_diagnostic` usa `secrets.SUPABASE_SERVICE_ROLE_KEY` en push a `main`. Aunque su código declara no enviar correo y usa endpoints de prueba, la garantía no se verificó contra el servicio remoto, que está fuera de alcance.
3. **Referencias mutables:** `actions/checkout@v4`, `actions/setup-node@v4` y `ubuntu-latest` no fijan un artefacto o imagen inmutable. Se debe inventariar el conjunto completo antes de imponer la opción administrativa «Require ... full-length SHA».
4. **Sin bloque de permisos explícitos:** recomendar `permissions: contents: read` en workflows offline futuros. La configuración predeterminada del repositorio actualmente es lectura según captura, pero puede cambiar.
5. **Sin `concurrency` declarada:** las ejecuciones de PR y push pueden coexistir; añadir un grupo estable con cancelación apropiada solo tras revisar dependencias y efectos.
6. **Timeout parcial:** `gmail_diagnostic` tiene 2 minutos; `syntax` no tiene `timeout-minutes` explícito.
7. **Cobertura de filtros:** `tests/customer-order-flow.cjs` está incluido en los filtros de `push`, pero no en los filtros de `pull_request`. Un PR que solo modifique esa prueba puede no ejecutar el workflow. Esto es una asimetría documentalmente comprobada.
8. **Dependencia de entorno:** `setup-node@v4` instala Node 22, pero no se observó instalación npm en este workflow. No afirmar reproducibilidad universal: el runner sigue siendo `ubuntu-latest`.

## Aislamiento propuesto, no implementado

- Para pruebas sintéticas de mensajerías/almacenes: ejecución local sin secretos, sin cartografía real, sin OSRM y sin endpoints externos; cuando se autorice CI, workflow **independiente** con `permissions: contents: read`, versiones de acciones fijadas a SHA verificadas, `timeout-minutes` acotado, runner explícito, filtros de rutas específicos y sin `workflow_dispatch` si no se necesita.
- Para storefront: estudiar separar en jobs distintos las pruebas JavaScript puramente locales y las pruebas remotas. La separación exigiría una autorización independiente porque modificaría el comportamiento de CI.
- Para controles de red: un job sin llamadas HTTP en sus scripts no implica aislamiento de red del runner; los pasos de checkout/setup pueden requerir red. La condición «offline» debe definirse como *sin acceso a sistemas empresariales externos* o verificarse con aislamiento de red real en un entorno local controlado.
- Para reversión futura: conservar copia del YAML y commit anterior; no activar protecciones hasta conocer los checks reales; probar primero en rama aislada y verificar que el propietario mantiene una vía de recuperación. Nunca modificar la configuración global como parte de una auditoría documental.

## Inventario: intento y limitación

Se exploraron las operaciones de GitHub disponibles: existe búsqueda de código en rama por defecto y lectura de archivos concretos, pero no un listado fiable del árbol. Búsquedas de `runs-on:`, `actions/checkout` y `workflow_dispatch` no devolvieron resultados; **cero resultados de búsqueda no demuestra ausencia de workflows** (el workflow recuperado sí contiene `runs-on:` y `actions/checkout`). El índice de búsqueda no es una fuente fiable para inventario completo en este contexto.

**Bloqueante vigente:** inventario exhaustivo de `.github/workflows` y verificación de todos los permisos efectivos de jobs no disponibles con las operaciones probadas. No se solicita al propietario una nueva captura porque el trabajo documental restante no la requiere.

## Estado

Sin cambios operativos, sin llamadas a Supabase/staging/producción, sin CI ejecutada, sin despliegues, sin descargas de cartografía y sin costos generados. El siguiente hito productivo es retomar el diseño y las pruebas sintéticas del sistema de entregas de La Habana, manteniendo el aislamiento actual.
