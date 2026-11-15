# Evidencia reproducible — validador offline exacto — 2026-11-14

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Se inspeccionaron los tres archivos directamente en GitHub al commit `65000998af0e8dfc56d88f41aa4fceb3fed8943b` y se reconstruyeron en un directorio temporal local sin clonar ni descargar el repositorio. Se compararon los SHA Git (`git hash-object`) de los archivos locales con los SHA de objetos proporcionados por GitHub:

| Archivo | SHA Git verificado |
|---|---|
| `tests/audit-havana-manifest-workflows-offline.py` original | `dc16349834cf629fe233462fff38b4572cae1f19` |
| `.github/workflows/havana-manifest-offline-candidate.yml` | `e560324ba32bb8942a23831947355462f629cb21` |
| `.github/workflows/havana-manifest-offline-preparation.yml` | `f68afe8d9065fa93bca4e503fefe341fd26656a7` |

## Ejecución exacta del validador original

Con Python 3, PyYAML 6.0.3 preinstalado y sin llamadas de red:
```sh
python tests/audit-havana-manifest-workflows-offline.py .github/workflows
```

Salida:
```text
PASS baseline havana-manifest-offline-preparation.yml
PASS baseline havana-manifest-offline-candidate.yml
PASS 35 adversarial mutations
```

`python -m py_compile`: PASS.

Hashes SHA-256 calculados localmente a partir de `steps[].run` en el YAML exacto:
- Bootstrap: `043cb738b79aa6a9a75437e316f9ca77b1084241b4e17519d86c7c3d69d91dc8`
- Pruebas Node con namespace: `f1e1808e44f82205346c804bc63e232ff304aef09282dc178a367e44e1f29240`

Ambos coinciden con los hashes fijados en el validador.

## Fallo adicional demostrado y corregido

La batería adversarial original utilizaba `assert`. Con `python -O` se eliminan las aserciones, por lo que la batería podía imprimir PASS sin ejecutar las comprobaciones; esto es un bypass reproducible. Se sustituyeron todas las aserciones de `main` por `require(condition, detail)`, que lanza `RuntimeError` independientemente del modo de optimización. El nuevo archivo tiene SHA Git `07191826a5bca38f08856ce889c37e37df0910f3`.

Se ejecutó localmente el archivo corregido en modo normal y `python -O` contra los YAML exactos: ambos reportaron los dos PASS base y 35 mutaciones rechazadas. Además se creó una copia local temporal del YAML candidato alterando `if: false` a `if: true`; `python -O` **falló como debía**. No se modificaron los YAML originales.

## Restricciones intactas

Los dos workflows siguen con `on: {}`, `if: ${{ false }}`, `permissions: {}`, flags comerciales desactivados y SHA de procedencia obsoleto. No se activó GitHub Actions, no se ejecutaron comandos del YAML, no se descargaron mapas, no se ejecutó OSRM y no se accedió a Supabase, staging, producción, clientes ni pedidos.

**No certificado:** aislamiento de red en runner hospedado, restricciones de egress antes del namespace y costo cero de una ejecución futura. Se mantiene el bloqueo hasta autorización y comprobaciones independientes.
