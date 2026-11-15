# Matriz de costo cero y seguridad para CI sintético — 2026-11-15

**Repositorio:** `Liuben810921/enlace-digital`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit de partida:** `495d3c150105d17b9ecff1067b2b5fa3135744fb`  
**Alcance:** inspección de metadatos en solo lectura y documentación pública; ningún workflow creado, modificado ni ejecutado.

## Evidencia de GitHub, verificada en esta etapa

La consulta de metadatos mediante el conector GitHub devolvió:
- `visibility: public` (**confirmado**)
- `archived: false` (**confirmado**)
- `default_branch: main` (**confirmado**)
- propietario de tipo `User`; permiso `admin: true` para la conexión (**confirmado**).
- Estos metadatos **no exponen** la política de Actions permitidas, el estado del interruptor Actions, las restricciones organizativas, los permisos por defecto de `GITHUB_TOKEN`, las cuotas consumidas ni la facturación. Se registran como **no verificados**, no como desactivados ni aprobados.

## Matriz de decisión

| Control | Evidencia | Estado | Condición previa a activar |
|---|---|---|---|
| Repositorio público | API GitHub `visibility=public` | **Verificado** | Conservar visibilidad y evitar exponer secretos |
| Runner estándar `ubuntu-24.04` | Política oficial de GitHub: gratis en repos públicos | **Costo de cómputo $0 bajo condición** | Prohibir larger runners; comprobar etiqueta real |
| Almacenamiento adicional | No se propone `upload-artifact`, cache ni imágenes personalizadas | **Diseño sin almacenamiento adicional** | No añadir pasos de almacenamiento sin reevaluación |
| Acciones habilitadas y política de permitidas | No disponible en metadatos de repositorio | **Pendiente** | Comprobar `Settings > Actions > General` en solo lectura |
| Permisos por defecto de token | No disponible en metadatos de repositorio | **Pendiente** | Confirmar restringidos; especificar `permissions: contents: read` |
| Acciones fijadas | Propuesta anterior usa etiquetas `@v4`, `@v5` | **No apto** | Usar SHA completos auditados o lockfile oficial compatible |
| Disparadores | Propuesta documental usa `workflow_dispatch` | **No apto sin autorización** | Aprobar disparador restrictivo; no instalar aún |
| Concurrencia | Falta en ejemplo anterior | **Pendiente** | Grupo exclusivo `ed-havana-osrm-offline-${{ github.ref }}` |
| Tiempo máximo | `timeout-minutes: 5` propuesto | **Diseñado, no ejecutado** | Confirmar margen en runner GitHub |
| Python 3.13 | 120 pruebas previas en Linux Python 3.13.5 | **Validación local** | Validar versión real del runner |
| Cobertura de pruebas | 120/120 normal y -O en entorno local previo | **Validación local** | Exigir 120 pruebas y cero omisiones en CI |
| Cotizaciones comerciales | `commercial_approval=false`, `commercial_quote_enabled=false` | **Prohibición vigente** | No conectar resultados sintéticos a operaciones |
| Gastos reales de la cuenta | No consultados por instrucción | **No verificados** | No extrapolar facturación de otras funciones |

## Decisión de costo cero

GitHub documenta que los **runners estándar GitHub-hosted para repositorios públicos** no consumen la asignación de cómputo incluida y son gratuitos. Esto cubre un futuro job de pruebas con `ubuntu-24.04` estándar mientras el repositorio permanezca público y se mantenga ese tipo de runner. No implica gratuidad de larger runners ni de recursos o servicios adicionales. Tampoco constituye una lectura de la facturación privada del usuario.

La política oficial también advierte que quienes tienen permisos de escritura pueden iniciar ejecuciones y que los cargos aplicables se atribuyen al propietario. Por tanto, el diseño debe evitar activaciones innecesarias, dependencias externas, cachés, artefactos y matrices expansivas.

## Recomendación de seguridad antes de cualquier activación

1. Comprobar **sin modificar** `Settings > Actions > General`: estado de Actions, acciones permitidas, exigencia de SHA completo, `Workflow permissions` y autorización para crear/aprobar PR.
2. No instalar `.github/workflows/` hasta aprobación expresa independiente.
3. Fijar acciones por SHA completo validado o lockfile oficial de dependencias; checkout sin persistencia de credenciales.
4. Mantener `permissions: contents: read` y ningún secreto, token de escritura, despliegue, `pull_request_target` ni `workflow_run`.
5. Grupo de concurrencia exclusivo, `timeout-minutes: 5`, un solo runner estándar Linux y Python 3.13, sin `pip install`.
6. Bloquear aceptación si hay pruebas omitidas, faltantes o fallidas; conservar ambas ejecuciones normal y `-O`.
7. Exigir revisión del diff de workflows y autorización del propietario antes de cualquier ejecución.

## Referencias oficiales consultadas

- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Choosing the runner for a job: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job
- Managing GitHub Actions settings for a repository: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository
- Workflow syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

## Límites y resultado

**Verificado:** visibilidad pública y metadatos básicos. **No verificado:** ajustes administrativos internos de Actions y facturación privada. **Sin cambios operativos:** no se descargó cartografía, ejecutó OSRM, creó cuentas, activó Actions, incurrió en costos ni accedió a Supabase, staging o producción. No se ejecutó regresión nueva porque esta fase fue de solo lectura y análisis documental; los 120/120 anteriores siguen siendo evidencia histórica, no ejecución actual.
