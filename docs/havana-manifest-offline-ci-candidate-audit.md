# Auditoría de la variante CI cartográfica (bloqueada)

Archivo: `.github/workflows/havana-manifest-offline-candidate.yml`.

## Configuración verificada por lectura estática
- `on: {}` y `if: ${{ false }}`: no tiene evento de ejecución ni job habilitado.
- `runs-on: ubuntu-24.04` runner estándar; `timeout-minutes: 5`; `permissions: {}`.
- No `uses`, acciones externas, servicios, contenedores, `npm install`, `pip`, `apt`, caché, subida de artefactos ni secretos explícitos.
- Obtención pública mediante `git fetch` de `https://github.com/Liuben810921/enlace-digital.git` con SHA fijado de forma deliberadamente obsoleta: `886bcfc55cd482613025ffe9befe22d9462c1a58`. La condición de igualdad con `GITHUB_SHA` bloquea toda ejecución en commits posteriores sin nueva revisión.
- Se deshabilitan prompts y helper de credenciales y redirecciones HTTP de Git; no se configura token.
- Tras adquirir el código, `unshare --user --map-root-user --net --fork` intenta crear espacio de red aislado para ejecutar dos pruebas Node. Si el runner prohíbe unprivileged namespaces, el comando falla y **no** ejecuta pruebas con red. No se usa `sudo`.

## Limitaciones no resueltas
1. `git fetch` de un SHA directo podría estar prohibido o no anunciado por el servidor GitHub; no se ha probado. Una alternativa futura debe verificarse sin ejecutar CI ahora.
2. El comando `git` conecta a GitHub sobre HTTPS, pero el YAML no constituye una restricción de egress de red a nivel de firewall: una garantía estricta de 'solo GitHub' durante bootstrap requiere controles de red externos verificados. El runner también puede tener tráfico de inicialización de plataforma ajeno a los pasos del workflow.
3. `unshare` puede estar deshabilitado en runner estándar; no hay evidencia de que el aislamiento funcione en GitHub Actions. La ejecución fallaría cerrada.
4. El checkout de código remoto incluye contenido potencialmente no confiable; el aislamiento se activa antes de ejecutar scripts Node, pero falta evaluar todas las operaciones de bootstrap y la procedencia de archivos.
5. La gratuidad de runners estándar en repositorios públicos no prueba que la cuenta nunca tenga cargos por otras operaciones; sin ejecución, no hay mediciones de facturación.
6. El workflow deshabilitado no puede proporcionar evidencia CI de los tests; no afirmar PASS de esta variante.

## Condiciones para autorización futura
- Revisar SHA actual y fijar el nuevo commit explícitamente.
- Confirmar disponibilidad de runner estándar sin costo, límites de cuota y política de red; demostrar que la obtención pública no contacta otros hosts.
- Verificar capacidad de `unshare` y bloqueo real de egress con prueba negativa en entorno desechable autorizado.
- Solo tras cumplir lo anterior, pedir autorización independiente para cambiar disparadores y ejecutar. No habilitar automáticamente.

Estado: `assetReady=false`, `routeReady=false`, `quoteReady=false`. Ningún acceso a Supabase, staging, producción, clientes, pedidos o inventario.

## Auditoría adversarial posterior (2026-11-14)
**Corrección demostrable:** el candidato original ejecutaba `git checkout` antes de crear el namespace de red. Una ruta de checkout puede invocar filtros `smudge` configurados mediante atributos Git; la mera desactivación de hooks no evita esos filtros. Se reemplazó el checkout por extracción explícita de tres blobs con `git show FETCH_HEAD:ruta`, verificación `git cat-file -t` y modo `100644` con `git ls-tree`. No se invocan hooks, submódulos ni filtros de checkout.

**Revisión de estructura YAML y shell (estática):** el archivo conserva `on: {}`, `if: ${{ false }}`, runner estándar `ubuntu-24.04`, `permissions: {}`, cinco minutos, sin `uses`, servicios, contenedores, dependencias, cachés, artefactos o secretos. Los bucles `for ... do ... done` y las comprobaciones `test` son sintaxis Bash convencional. No se dispone de prueba del parser de GitHub Actions sobre este commit, ni de una ejecución de las secuencias shell en el runner; **no se afirma CI PASS**.

**Procedencia:** URL pública del repositorio literal; comprobación de `GITHUB_REPOSITORY`, rama, SHA esperado, `FETCH_HEAD`, tipos y modos. El SHA fijado deliberadamente en `886bcfc55cd482613025ffe9befe22d9462c1a58` no coincide con el commit actual; el job está bloqueado incluso si se habilitase el disparador accidentalmente. No hay checkout de archivos adicionales. `git show` no prueba que los contenidos sean seguros: el código Node ejecutado deberá revisarse y fijarse por hash antes de habilitar.

**Red:** `unshare --user --map-root-user --net --fork` crea un namespace de red para las pruebas, o falla cerrado si no está permitido. No hay evidencia de que funcione en `ubuntu-24.04` de GitHub-hosted. Antes de `unshare`, `git fetch` requiere red; Git y el runner pueden conectar a otros destinos por infraestructura, DNS, proxy o configuración. No existe una política firewall demostrada de egress exclusivo a GitHub. La variable `GIT_CONFIG_NOSYSTEM` y `GIT_CONFIG_GLOBAL=/dev/null` reducen herencia de configuración, pero no constituyen un firewall.

**Permisos:** `permissions: {}` impide conceder scopes al `GITHUB_TOKEN` en el job; la ausencia de `uses` y variables secretas reduce superficie. El runner hospedado mantiene sus propios permisos de sistema y acceso de red previo al namespace; no asumir sandbox absoluto.

**Costos:** runner estándar para repositorio público es elegible para uso gratuito según política general de GitHub, pero no hay verificación específica de facturación, cuota, almacenamiento o tráfico de la cuenta. Como no se activó, no hay minutos de ejecución de este workflow. No afirmar costo cero futuro garantizado.

**Bloqueantes restantes:** control efectivo de egress durante bootstrap, soporte real de namespace sin privilegios, obtención de SHA mediante fetch directo, validación de sintaxis por GitHub y confirmación de costos de la cuenta. Mantener CI inactivo; no iniciar pruebas sin autorización específica.
