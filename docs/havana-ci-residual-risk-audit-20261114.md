# Auditoría offline de riesgos residuales CI cartográfico — 2026-11-14

Referencia inicial: `b07e968b862a2a8679969207303336975b8160e7`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Evidencia examinada
Se reabrieron íntegramente mediante el conector GitHub los tres archivos exactos:
- `.github/workflows/havana-manifest-offline-candidate.yml`, blob Git `e560324ba32bb8942a23831947355462f629cb21`.
- `.github/workflows/havana-manifest-offline-preparation.yml`, blob Git `f68afe8d9065fa93bca4e503fefe341fd26656a7`.
- `tests/audit-havana-manifest-workflows-offline.py`, blob Git `f90959094c3f955a23015b4f08c8dacdb57f4f0e`.

No se ejecutaron workflows, comandos de shell de CI, `git fetch`, `unshare`, Node ni OSRM. Este documento es una auditoría **estática**; no constituye prueba dinámica de aislamiento ni de facturación.

## Matriz de riesgos y mitigaciones verificables

| ID | Riesgo comprobado por código o no demostrado | Mitigación propuesta (no aplicada) | Evidencia requerida antes de autorizar ejecución |
|---|---|---|---|
| R01 | `GITHUB_SHA` se compara con un SHA literal antiguo y `git fetch` obtiene ese objeto. El código verifica commit y modo `100644`, pero no coteja SHA-256 esperado por cada blob extraído | Manifiesto inmutable con identificadores de objeto Git y SHA-256 por cada archivo, cotejados antes de ejecutar Node; revisión independiente de commit/árbol y firmas cuando proceda | Pruebas locales de archivo sustituido, modo alterado, árbol divergente y hash incorrecto |
| R02 | `git fetch` se ejecuta **antes** de `unshare --net`; `http.followRedirects=false` no es un cortafuegos | Preferir paquete de código previamente revisado y suministrado sin red durante la ejecución; si se requiere red de bootstrap, documentar control externo verificable de egress y DNS, sin prometer que Git por sí solo lo restringe | Captura de configuración de red del entorno autorizado y prueba controlada de egress, con aprobación independiente |
| R03 | `unshare --user --map-root-user --net` puede fallar en runner hospedado por política de kernel; no se ha comprobado su disponibilidad | Conservar fallo cerrado sin fallback; estudiar runner efímero con aislamiento garantizado por infraestructura o ejecutar pruebas puramente estáticas sin red | Evidencia de versión kernel, política user namespaces, capacidades y prueba de aislamiento autorizada en entorno desechable |
| R04 | `ip link set lo up ... || true` permite continuar si no se configura loopback. Esto no reabre la red externa, pero puede enmascarar fallos y dificultar diagnóstico | Sustituir por verificación explícita de loopback o retirar dependencia; no relajar `unshare` | Prueba controlada de fallo y código de salida dentro del entorno aislado |
| R05 | `permissions: {}` a nivel global y job reduce permisos de `GITHUB_TOKEN`, pero no garantiza por sí solo ausencia de credenciales del runner, inyección de variables ni acceso a servicios externos | Definir modelo de amenazas del runner, limitar secretos, comprobar token y entorno efectivos sin revelar valores, evitar `pull_request_target` y código no confiable | Revisión administrativa de políticas, secretos, permisos efectivos y procedencia de ejecución |
| R06 | `runs-on: ubuntu-24.04` no fija imagen por digest; versiones Git/Node/Bash/util-linux/grep pueden cambiar. No hay instalación `npm` en el workflow, pero los tests Node extraídos son código ejecutable | Registrar versiones y checksums de herramientas, usar entorno reproducible aprobado o mantener validación local sin ejecutar Node | SBOM o inventario de binarios y pruebas reproducibles en entorno sin red |
| R07 | `timeout-minutes: 5` y `2` limitan duración por job, pero no garantizan costo cero ni ausencia de cargos por repositorio/plan/cuotas | Verificar políticas de facturación y runners de la cuenta, presupuesto y límites con el Owner; no habilitar ejecución hasta aprobación explícita | Capturas administrativas de límites aplicables y confirmación de ausencia de cargos no deseados |
| R08 | Los YAML están deshabilitados con `on: {}` e `if: ${{ false }}`; una modificación futura podría eliminar ambos bloqueos | Proteger ramas y requerir revisión independiente para cambios bajo `.github/workflows/`; mantener validador local y revisión de diff | Evidencia de reglas de protección y revisión de cualquier cambio propuesto |
| R09 | El validador compara SHA-256 de los cuerpos `run` del candidato, pero no impone integridad byte a byte del archivo YAML completo: comentarios y formato pueden cambiar | Fijar hashes del documento completo si el objetivo es reproducibilidad byte a byte; conservar la verificación semántica actual como control complementario | Pruebas de alteraciones en comentarios, espacios, orden y metadatos; decisión documentada sobre canonización |
| R10 | El validador necesita PyYAML instalado localmente; su disponibilidad e integridad no están fijadas por un lockfile propio del auditor | Documentar versión mínima exacta y hash de distribución verificada en un entorno aprobado; prohibir instalación automática en el workflow | Reproducción en entorno limpio offline y comparación de versión/hash del paquete |

## Condiciones de salida / decisión

**NO-GO** para ejecutar o activar CI cartográfico mientras R01–R03 y R07 no tengan evidencia independiente y aprobación explícita. La mitigación preferida para cero red es eliminar `git fetch` de la futura ejecución, no simplemente suponer que `unshare` protege el bootstrap.

Los dos YAML no se han modificado: siguen `on: {}`, `if: ${{ false }}`, `permissions: {}`, flags de cartografía/cotización desactivados y SHA literal de bloqueo. No se descargó cartografía ni se accedió a Supabase, staging, producción, clientes, pedidos o inventario. No se generaron ejecuciones de GitHub Actions ni costos operativos desde esta auditoría.
