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
