# Verificación de hashes y política estática — 14 noviembre 2026

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Fallo encontrado y corregido
El validador publicado en el commit `ef7e84b7281c6601f21cec2085cefc6336f11005` contenía `BOOTSTRAP_SHA='TO_BE_PINNED'` e `ISOLATED_SHA='TO_BE_PINNED'`. Por tanto **rechazaba incorrectamente el workflow candidato legítimo** y no podía considerarse aprobado. Se sustituyeron ambos marcadores por SHA-256 calculados sobre los cuerpos exactos de `run` del YAML consultado por GitHub:
- Bootstrap: `043cb738b79aa6a9a75437e316f9ca77b1084241b4e17519d86c7c3d69d91dc8`
- Pruebas con namespace de red: `f1e1808e44f82205346c804bc63e232ff304aef09282dc178a367e44e1f29240`

Se eliminó código muerto de la auditoría y se añadió verificación de nombres de pasos, además de casos adversariales para `if`, servicios, checkout, secretos, subida de artefactos, cambio de host, alteración de SHA, namespace de red y permisos de escritura.

## Ejecución offline y alcance
Se reconstruyeron localmente los dos YAML obtenidos mediante la conexión GitHub (sin descargar repositorios ni datos). Con Python 3 y PyYAML 6.0.3 **ya instalado**, la implementación local equivalente de la auditoría reportó:
- `PASS baseline havana-manifest-offline-preparation.yml`
- `PASS baseline havana-manifest-offline-candidate.yml`
- `PASS 23 adversarial mutations`
- `python -m py_compile` sin errores

Los dos SHA-256 anteriores se recalcularon localmente y coincidieron con los valores fijados. Se probaron mutaciones que habilitan triggers, elevan permisos, sustituyen runner, añaden dependencias o comandos y desactivan el namespace. **No se ejecutó ninguno de los comandos de los workflows**.

La implementación local se reconstruyó a partir del código de GitHub, pero no se realizó una comparación byte a byte del script completo remoto después de su último commit. Por tanto, no se afirma ejecución del archivo exacto remoto ni certificación por GitHub Actions.

## Límites y bloqueos
- La comprobación de sintaxis es PyYAML, no el validador de GitHub Actions. El workflow sigue con `on: {}` e `if: false`.
- Los hashes fijan cuerpos de shell, pero no garantizan que GitHub ejecute `unshare` en runners hospedados. El aislamiento y las restricciones de salida de red antes de `unshare` no están demostrados.
- El SHA del código que se obtendría está intencionadamente obsoleto: el workflow falla cerrado.
- Runners estándar públicos pueden ser gratuitos según GitHub, pero no se ha certificado la facturación particular ni el costo cero de una futura ejecución.
- No se activó CI, no se descargaron datos OSM, no se ejecutó OSRM y no se accedió a Supabase, staging, producción, clientes, pedidos ni inventario.

**Decisión:** conservar ambos workflows deshabilitados; se requiere autorización separada y demostración de seguridad/costo antes de cualquier ejecución.
