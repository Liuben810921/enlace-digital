# Diagnóstico de visibilidad de GitHub Actions — 2026-11-10

Base autorizada: `dafb2f26a0558c82350ac1bd911276b7cf73496e`. Solo GitHub; ninguna consulta a Supabase, SQL, despliegue ni código operativo.

## Hallazgo principal: limitación del método de consulta
El conector `fetch_commit_workflow_runs` indica explícitamente que **filtra las ejecuciones por evento pull_request y devuelve solo la primera página**. Por tanto, su respuesta `workflow_runs: []` para los commits de esta rama NO demuestra ausencia de ejecuciones `push`, `workflow_dispatch` ni de otras páginas. `get_commit_combined_status` consulta estados de commit tradicionales y tampoco constituye por sí solo una enumeración de check runs de GitHub Actions. Las conclusiones anteriores de CI **SIN VERIFICAR** son correctas; no se puede concluir CI fallido ni Actions desactivado.

## Evidencias del repositorio
- PR #2: abierto, borrador, base `main`, head `audit/registro-staging-aislado-20261109`; al comenzar la auditoría su head era `dafb2f26a0558c82350ac1bd911276b7cf73496e`.
- Workflow `.github/workflows/staging-auth-static-check.yml`: `push` limitado a esa rama, `pull_request` limitado a base main, `workflow_dispatch`; filtros `paths` incluyen el propio workflow, scripts y documentos recientes.
- Job `static`: `actions/checkout@v4`, `denoland/setup-deno@v2`, `deno check`, tests mock offline, Node tests, validadores Python y parser PostgreSQL local `pglast`. No hay pasos que ejecuten migraciones o llamen a Supabase.
- El PR permanece en modo borrador. El borrador NO prueba por sí mismo que los eventos `push` estén desactivados.
- No se observó defecto sintáctico evidente en la estructura de disparadores. No se modificaron por falta de evidencia de fallo.

## Matriz de verificación y bloqueo
| Control | Resultado | Siguiente evidencia requerida |
|---|---|---|
| GHA01 — PR head y rama | CONFIRMADO | Revisar que el commit final siga siendo el head |
| GHA02 — push branch | CONFIGURADO | Run de evento push para SHA exacto |
| GHA03 — pull_request main | CONFIGURADO | Run de evento pull_request y su head SHA |
| GHA04 — paths | CONFIGURADO | Confirmar coincidencia de archivo modificado |
| GHA05 — workflow_dispatch | CONFIGURADO | No lanzar manualmente sin autorización específica |
| GHA06 — estado global Actions | NO VERIFICADO | Consultar listado sin filtro de evento y configuración administrativa |
| GHA07 — jobs y logs | NO VERIFICADO | ID de run, jobs, steps y conclusión real |
| GHA08 — permisos de Actions | NO VERIFICADO | Settings/Actions: habilitado, restricciones y políticas de runners |
| GHA09 — checks de PR | NO VERIFICADO | Vista Checks y posibles ejecuciones omitidas por paginación |
| GHA10 — seguridad | CONFIRMADO POR CÓDIGO | Sin pasos SQL de ejecución ni deploy en workflow |

## Procedimiento de verificación posterior
1. Usar la vista GitHub Actions del repositorio o un endpoint autorizado que liste **todos los eventos**, paginando; filtrar por workflow, rama y SHA.
2. Identificar `run_id`, `event`, `head_sha`, `status`, `conclusion`, `run_attempt`; si hay run, inspeccionar jobs y logs.
3. Si no hay runs globales, revisar ajustes de Actions y restricciones de workflows/PR. No cambiar permisos sin nueva autorización.
4. Solo corregir workflow si existe error comprobado, con prueba reproducible. No equiparar ausencia en un listado PR-only a fallo.
5. Mantener estado CI **NO VERIFICADO** hasta obtener un run y job concluidos.

**NO-GO:** sin activar servicios, correos, pedidos reales, despliegues ni cambios a producción. **Reversión:** git revert del informe y su verificador estático; ninguna modificación a Supabase.

## Verificación adicional de ejecución histórica (lectura)
- Run **42850363760**: consulta por ID existente; job **129949044393**, nombre `static`, estado `completed`, conclusión **success**. Se observaron pasos completados y con `success` para typecheck, pruebas offline, validadores estáticos y parser SQL. Esta es evidencia **histórica**, no certifica commits recientes.
- Commit de inicio de esta etapa `5906c6c08a9f99de6ea0735b6528d668bf420fc0`: el conector `fetch_commit_workflow_runs` no devolvió runs de `pull_request`; `get_commit_combined_status` tampoco devolvió estados. No se dispone en las acciones de GitHub conectadas de una función que liste todos los runs `push` por rama/SHA. Sin run_id no se pueden leer sus jobs ni logs. Se intentó consultar la vista pública del workflow, pero no se obtuvo contenido verificable.
- **Decisión:** no modificar workflow ni validadores, ya que no se comprobó fallo actual. Estado de CI reciente **NO VERIFICADO**, no FAIL ni PASS.
