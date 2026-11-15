# Auditoría de permisos GitHub Actions — lectura y validación visual (2026-11-15)

**Repositorio:** `Liuben810921/enlace-digital`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit base:** `7556c261dfda6e3f667345bd99f2e31272d0fa6a`  
**Alcance:** inspección en solo lectura de controles accesibles; publicación de este informe únicamente. No se cambian ajustes ni workflows.

## Evidencia comprobada mediante conector GitHub

La consulta `get_repo` devolvió `visibility=public`, `archived=false`, `default_branch=main` y `permissions.admin=true` para la conexión. `fetch_commit` confirmó la existencia del commit base `7556c261dfda6e3f667345bd99f2e31272d0fa6a` y su mensaje de documentación. Estos metadatos **no incluyen** las opciones internas de Actions ni reglas de protección. La disponibilidad de permisos administrativos **no demuestra** que cada ajuste esté habilitado, restringido o sea visible mediante el conector.

## Matriz de controles y evidencia

| Control | Verificación en esta sesión | Recomendación, no aplicada |
|---|---|---|
| Visibilidad pública | **Verificado** por API | Mantener runners estándar y revisar si cambia visibilidad |
| Conexión con permisos admin | **Verificado** por API | No usar esos permisos para modificar ajustes |
| Actions habilitadas/deshabilitadas | **No accesible** en herramientas disponibles | Inspeccionar Settings → Actions → General → Actions permissions |
| Acciones permitidas / SHA completo | **No accesible** | Restringir acciones; exigir SHA completo o mecanismo oficial de lockfile |
| `GITHUB_TOKEN` por defecto | **No accesible** | Comprobar Workflow permissions y preferir read-only |
| Actions puede crear/aprobar PR | **No accesible** | Mantener deshabilitada esa opción para CI de pruebas |
| Aprobación de workflows de forks | **No accesible** | Inspeccionar Approval for running fork pull request workflows from contributors |
| Políticas de ejecución por actor y evento | **No accesible** | Revisar Settings → Actions → Policies, si aparece; restringir `workflow_dispatch` y `pull_request_target` |
| Protección clásica de `main` | **No accesible** | Revisar Settings → Branches → Branch protection rules |
| Rulesets de `main` y rama aislada | **No accesible** | Revisar Settings → Rules → Rulesets y targets/bypass |
| Estado de workflows existentes | **No inspeccionado** | No inferir su estado a partir de ajustes globales |
| Facturación privada | **Fuera de alcance** | No consultar |
| Pruebas 120/120 | **Resultado histórico**, no repetido | No confundir con ejecución nueva |

## Procedimiento visual seguro: solo lectura

1. Abrir `https://github.com/Liuben810921/enlace-digital/settings/actions`. En **General**, leer sin cambiar: Actions permissions, restricciones de acciones externas, opción de exigir SHA completo, aprobación de workflows procedentes de forks, Workflow permissions y opción para crear/aprobar pull requests. No pulsar **Save**.
2. En **Settings → Actions → Policies**, si está disponible, leer las reglas de **workflow execution protections**: actores permitidos, eventos permitidos, estado y alcance. No crear ni editar políticas.
3. Abrir `https://github.com/Liuben810921/enlace-digital/settings/branches`. Identificar reglas clásicas que afecten `main` y `plan/havana-osrm-benchmark-offline-20261114`; anotar PR obligatorio, revisiones, checks, force-push, eliminación y bypass. No usar **Add rule**, **Edit** ni **Save**.
4. Revisar **Settings → Rules → Rulesets** y, si aparece, **Rules → Insights**. Identificar reglas activas, objetivos de ramas y bypass. Una regla que exista no necesariamente afecta a las dos ramas.
5. Si algún panel no aparece, anotar literalmente **no visible**; no inferir que el control está desactivado. Capturas con secretos o datos privados ocultos pueden permitir verificar visualmente estos estados sin cambiar nada.

## Bloqueantes

No hay endpoint administrativo específico de Actions ni reglas de protección expuesto entre las acciones disponibles del conector en esta sesión. La consulta de metadatos `get_repo` no sustituye esos endpoints. Por ello no se puede certificar la política efectiva de `GITHUB_TOKEN`, aprobación de PR, protección de ramas ni ejecución por actor/evento. La verificación visual del propietario sigue siendo necesaria antes de cualquier autorización de CI.

## Contexto de documentación oficial

- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository
- https://docs.github.com/en/actions/concepts/about-actions-policies
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository

GitHub documenta una política futura que bloqueará `pull_request_target` por defecto en repositorios públicos a partir del 2 de diciembre de 2026; al 15 de noviembre no debe asumirse que esté aplicada.

## Seguridad y límites

Ningún workflow fue creado, activado, reejecutado o modificado. No se cambiaron permisos ni protección de ramas. No se descargó cartografía, ejecutó OSRM, generó costo ni accedió a Supabase, staging o producción. `commercial_quote_enabled=false` y `commercial_approval=false` siguen siendo condiciones del prototipo sintético.
