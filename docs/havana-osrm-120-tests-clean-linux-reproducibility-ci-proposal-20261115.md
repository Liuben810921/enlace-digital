# Reproducibilidad de 120 pruebas sintéticas y propuesta CI (no activada) — 2026-11-15

**Repositorio:** `Liuben810921/enlace-digital`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit fuente:** `396892d2065d1fc87f013e7f5f93a5c8263ea14f`

## Procedimiento y resultados reales

Se recuperaron desde GitHub los diez archivos Python del experimento, fijando el commit de origen. Se cotejó cada SHA-1 Git blob remoto con `git hash-object` local: **10/10 idénticos**. Se calcularon SHA-256 de las copias exactas.

Primero se ejecutó la batería en `/mnt/data/osrm-isolated-limits`:
- `python -m unittest discover -q`: **120 OK**, 3,152 s.
- `python -O -m unittest discover -q`: **120 OK**, 3,146 s.

Después se copiaron **solo los diez .py** a un directorio nuevo `/tmp/ed-clean-RambYM`, se hicieron de solo lectura, se ejecutó desde `/tmp` (fuera del directorio fuente), sin paquetes del usuario, sin `PYTHONPATH`, sin escribir bytecode, con Python aislado:
```sh
PYTHONDONTWRITEBYTECODE=1 PYTHONNOUSERSITE=1 PYTHONPATH='' python -I -m unittest discover -s /tmp/ed-clean-RambYM -p 'test_*.py' -q
PYTHONDONTWRITEBYTECODE=1 PYTHONNOUSERSITE=1 PYTHONPATH='' python -I -O -m unittest discover -s /tmp/ed-clean-RambYM -p 'test_*.py' -q
```
Resultados: **120/120 OK** (2,987 s) y **120/120 OK** (2,806 s). Sistema Linux, Python 3.13.5. Ningún archivo de código necesitó corrección.

El análisis de imports confirma uso de módulos locales y biblioteca estándar; **no se requiere instalación de paquetes Python de terceros**. El test `test_process_limits.py` sí exige Linux/POSIX con `resource.RLIMIT_AS`; fuera de Linux se omiten cinco pruebas, por lo que no debe presentarse una ejecución con omisiones como `120/120`.

## Identidad criptográfica de los diez archivos

| Archivo | SHA-1 Git blob remoto = local | SHA-256 |
|---|---|---|
| `compare_graphs_v2.py` | `a90dc87d622901ee22b6a6116d50ce5ae8a4e35f` | `5af9c6749340787b8c6f2cb8dd990052852dfbec30af7e110ae341af52fb17e8` |
| `test_compare_graphs_v2.py` | `705ebee25e07308546426d312a90321efbf0bc25` | `e424970acf8325269a22b57db63bfa169220c88eaf1a29bc39d621ea2584ab12` |
| `test_adversarial_v2.py` | `a0236a9af63c10745f61be18a1ed27b00ee3ac9b` | `3e2f32bbb9d087d8842f77ed8341fc43e7ab650ab330bcdf51a571a8226a7f9f` |
| `provenance_gate.py` | `69030499b1f3d78be540237ad5ff6cfea9078871` | `c5023397ebc57a064c75dda2ec72bcc3f132f6bf29b3a0b66a12c6592d81feb5` |
| `test_provenance_gate.py` | `bd99c52fc0ae9f5d32adda216df32aaa3ef83e15` | `4a60469574eab377412724f56d60ab27618ff4e8623b4d90b377538db7e417c6` |
| `synthetic_gate.py` | `04d3e7261f01ce9c0b82b8fae1cd9f5507b8fa5e` | `88510b4a6e4dd04bafb3b8cc5f558c0217fd96f5cce8d89f9b472ac1b954b17b` |
| `test_synthetic_gate.py` | `8b737215181978baf18e81785041eda7bd1a94c0` | `fc78cab5e5c626aeb0c9bdb1317fe0e11149cd716bfceeee6e3ae44af8332a53` |
| `test_security_gate.py` | `f6dd680837517f3eaf49384fb4470429f038644e` | `e59a9ac8bc84e18f0feb8af7ea7f8c46c282d11ce84e638e00def42baab3a6dd` |
| `test_resource_gate.py` | `008654c82956af103082c4a167e19eadc91b6594` | `ab36c5733ed4fb16310c8555b7d7d703370075dd9573524c58ddc00108bbfd03` |
| `test_process_limits.py` | `8ef2a6aa15ddf96de5ec23fe118e32b2f83df369` | `dbbcf0298c965bcc28091190d60787e413849ecd18b9fa78363370c22ad5e9ba` |

## Propuesta de CI — SOLO DOCUMENTAL

**No se ha creado ni modificado un archivo en `.github/workflows/`.** Ejemplo de diseño para futura revisión independiente, no activado:

```yaml
name: Offline synthetic OSRM gate (PROPOSAL ONLY)
on:
  workflow_dispatch:
jobs:
  offline-tests:
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - name: Verify normal tests
        working-directory: experiments/havana-osrm-portable
        run: python -I -m unittest discover -s . -p 'test_*.py' -q
      - name: Verify optimized tests
        working-directory: experiments/havana-osrm-portable
        run: python -I -O -m unittest discover -s . -p 'test_*.py' -q
```

**Advertencias:** el ejemplo no está endurecido para producción: las acciones están fijadas por etiquetas y no por SHA de commit, `workflow_dispatch` sería un disparador manual si se instalara, y la plataforma puede cambiar. Antes de cualquier aprobación de CI deben sustituirse las etiquetas por SHA inmutables verificados, evaluar permisos, concurrency, cuotas y disponibilidad del runner. El ejemplo se conserva únicamente como referencia y **no autoriza activación**.

## Bloqueantes y límites

- El ensayo usa Python 3.13.5 y Linux del entorno local, no una imagen nueva de GitHub-hosted runner ni una matriz de versiones.
- La prueba de timeout comprueba terminación de un hijo controlado; no demuestra límites universales para entradas hostiles.
- No se autentica al productor ni se verifica cobertura geográfica real.
- `accepted_for_synthetic_review` no es autorización comercial. `commercial_approval=false` y `commercial_quote_enabled=false`.

No se descargó cartografía, ejecutó OSRM, creó cuentas, activó GitHub Actions, generó costos ni accedió a Supabase, staging o producción.
