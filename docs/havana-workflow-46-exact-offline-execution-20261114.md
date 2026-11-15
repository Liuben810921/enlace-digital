# Ejecución exacta offline — 46 pruebas — 2026-11-14

**Referencia:** `c277e802e537f8bd2d903cd1857e7bb396a491db`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

Se consultaron por el conector GitHub los contenidos íntegros de los tres archivos y se reconstruyeron localmente. La identidad byte a byte se comprobó con `git hash-object` contra los SHA Git obtenidos de GitHub. No se clonó el repositorio ni se descargaron cartografía o dependencias.

| Archivo | SHA Git verificado | SHA-256 local |
|---|---|---|
| `tests/audit-havana-manifest-workflows-offline.py` | `f90959094c3f955a23015b4f08c8dacdb57f4f0e` | `58a7065edf4f54e96bfe92e95178b83114ece5e489231b12af77a0c9758ff710` |
| `.github/workflows/havana-manifest-offline-candidate.yml` | `e560324ba32bb8942a23831947355462f629cb21` | `38c917ee9c88c3835fb7938fa161f141b2382b3b81fe830ea628123bca03d461` |
| `.github/workflows/havana-manifest-offline-preparation.yml` | `f68afe8d9065fa93bca4e503fefe341fd26656a7` | `d9123d8748507d6d8f7027c0ae025696c3f23ceebafd1849df689113c5973c9f` |

**Entorno:** Python 3.13.5; PyYAML 6.0.3 preinstalado. No se ejecutó ningún comando del YAML.

## Comandos y resultados exactos

```sh
python -m py_compile tests/audit-havana-manifest-workflows-offline.py
python tests/audit-havana-manifest-workflows-offline.py .github/workflows
python -O tests/audit-havana-manifest-workflows-offline.py .github/workflows
```

Ambas ejecuciones:
```text
PASS baseline havana-manifest-offline-preparation.yml
PASS baseline havana-manifest-offline-candidate.yml
PASS 46 adversarial mutations
```

- Compilación de sintaxis: **PASS**.
- Python normal: **exit 0**.
- Python `-O`: **exit 0**.
- Copia temporal con `if: ${{ false }}` alterado a `if: ${{ true }}` en el candidato: **exit 1** en ambos modos, `RuntimeError: offline audit failed: ('havana-manifest-offline-candidate.yml',)`.
- Hash SHA-256 de `steps[0].run` del candidato: `043cb738b79aa6a9a75437e316f9ca77b1084241b4e17519d86c7c3d69d91dc8`.
- Hash SHA-256 de `steps[1].run`: `f1e1808e44f82205346c804bc63e232ff304aef09282dc178a367e44e1f29240`.
- Los dos hashes coinciden con los fijados en el validador.

## Resultado y alcance

**PASS de los 46 casos definidos en el validador exacto**, en ambos modos. No se identificaron fallos que requirieran modificar código o YAML en esta ejecución. Las pruebas comprueban políticas estáticas y rechazo de mutaciones; no demuestran la seguridad dinámica de un runner ni la ausencia absoluta de bypasses no contemplados.

Se conservan `on: {}`, `if: ${{ false }}`, `permissions: {}`, los flags de cartografía y cotización desactivados y el SHA de procedencia obsoleto. **No activar GitHub Actions.** El acceso a red para `git fetch` previo a `unshare`, las garantías de aislamiento del runner y los costos futuros continúan pendientes de evaluación separada. No se accedió a Supabase, staging ni producción; no se ejecutó OSRM ni se descargaron mapas.
