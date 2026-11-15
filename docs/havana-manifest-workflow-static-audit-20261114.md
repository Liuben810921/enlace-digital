# Auditoría offline de workflows cartográficos — 2026-11-14

Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Implementación
- Se agregó `tests/audit-havana-manifest-workflows-offline.py`, validador estático que requiere PyYAML **preinstalado**. No instala paquetes ni ejecuta los pasos del YAML.
- Analiza exclusivamente `.github/workflows/havana-manifest-offline-preparation.yml` y `.github/workflows/havana-manifest-offline-candidate.yml`.
- Rechaza YAML malformado y claves duplicadas; trata `on` como clave YAML y no como booleano.
- Exige `on: {}`, `if: false` expresado como condición GitHub, `permissions: {}`, `ubuntu-24.04`, tiempo máximo de cinco minutos, pasos Bash sin `uses`, flags comerciales apagados y variables de entorno restringidas.
- Fija los cuerpos de shell del candidato mediante SHA-256, de modo que agregar `curl`, `sudo`, `npm`, checkout, acciones de red o fallbacks debe invalidar la política. Los hashes requieren revisión independiente antes de utilizar este script como puerta de activación.
- Casos adversariales del script: triggers push/dispatch, permisos ampliados, runner distinto, timeout mayor, claves YAML duplicadas, comandos añadidos y sintaxis inválida.

## Evidencia local y limitación
- En un entorno local sin acceso a red se ejecutó una batería de desarrollo de validación YAML con PyYAML 6.0.3: dos configuraciones base PASS y **21 mutaciones adversariales rechazadas**. No se ejecutó ningún workflow ni sus comandos.
- La batería de desarrollo local y el archivo final incorporado a GitHub no son byte a byte idénticos. **No se afirma PASS de la versión exacta del repositorio**, ni validación de GitHub Actions, ni aislamiento de red demostrado.
- No se ha realizado descarga de datos ni acceso a Supabase, staging o producción.

## Riesgos pendientes
1. `git fetch` ocurre antes de crear el namespace de red: sin firewall verificable no puede demostrarse egress exclusivamente a GitHub.
2. `unshare --user --map-root-user --net` puede estar prohibido en runners estándar; el diseño falla cerrado pero no hay prueba de ejecución.
3. Un SHA fijo obsoleto bloquea el job: no actualizar ni habilitar sin nueva autorización.
4. Runners estándar para repositorios públicos son elegibles para uso gratuito; no se ha verificado facturación individual ni condiciones de tráfico/almacenamiento. **Costo cero futuro no certificado**.
5. El validador estático depende de PyYAML preinstalado localmente y no forma parte de un CI habilitado.

**Decisión:** conservar ambos workflows deshabilitados; no iniciar GitHub Actions, servicios externos, ni despliegues. `assetReady=false`, `routeReady=false`, `quoteReady=false`.
