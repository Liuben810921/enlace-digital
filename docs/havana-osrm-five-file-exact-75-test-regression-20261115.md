# Verificación exacta de cinco archivos y 75 pruebas — 2026-11-15

**Repositorio:** `Liuben810921/enlace-digital`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit base verificado:** `98d37a60b2c26630825575afb06e696be24182ad`

## Método

Se recuperó el contenido de los cinco archivos mediante el conector GitHub fijado al commit base. Tres archivos ya estaban presentes como copias locales de verificaciones anteriores; los otros dos se reconstruyeron a partir del contenido recuperado. Para **cada** archivo se comparó `git hash-object` de la copia local con el SHA-1 blob devuelto por GitHub. Los cinco coincidieron. Se calculó adicionalmente SHA-256 sobre los bytes exactos de cada copia. No se descargó cartografía ni se ejecutó OSRM.

## Identidad de bytes

| Archivo | Bytes | SHA-1 Git blob GitHub = local | SHA-256 local |
|---|---:|---|---|
| `compare_graphs_v2.py` | 3695 | `a90dc87d622901ee22b6a6116d50ce5ae8a4e35f` | `5af9c6749340787b8c6f2cb8dd990052852dfbec30af7e110ae341af52fb17e8` |
| `test_compare_graphs_v2.py` | 5206 | `705ebee25e07308546426d312a90321efbf0bc25` | `e424970acf8325269a22b57db63bfa169220c88eaf1a29bc39d621ea2584ab12` |
| `test_adversarial_v2.py` | 1962 | `a0236a9af63c10745f61be18a1ed27b00ee3ac9b` | `3e2f32bbb9d087d8842f77ed8341fc43e7ab650ab330bcdf51a571a8226a7f9f` |
| `provenance_gate.py` | 2638 | `69030499b1f3d78be540237ad5ff6cfea9078871` | `c5023397ebc57a064c75dda2ec72bcc3f132f6bf29b3a0b66a12c6592d81feb5` |
| `test_provenance_gate.py` | 2791 | `bd99c52fc0ae9f5d32adda216df32aaa3ef83e15` | `4a60469574eab377412724f56d60ab27618ff4e8623b4d90b377538db7e417c6` |

## Pruebas locales sobre las copias exactas

Python `3.13.5`, directorio de trabajo `/mnt/data/osrm-75-exact`.

```sh
python -m unittest -q test_compare_graphs_v2 test_adversarial_v2 test_provenance_gate
python -O -m unittest -q test_compare_graphs_v2 test_adversarial_v2 test_provenance_gate
```

Ambos comandos:

```text
----------------------------------------------------------------------
Ran 75 tests in 0.017s

OK
```

**75/75 en Python normal y 75/75 con -O; sin fallos ni divergencias.** No se modificó ningún archivo de código ni de pruebas. Estos son resultados locales; no se afirma haber ejecutado ni verificado GitHub Actions.

## Límites y bloqueantes

- Los hashes del manifiesto comprueban integridad relativa, **no autenticidad** ni cadena de custodia.
- `in_coverage` es una declaración sintética; no hay comprobación de polígonos, topología o conectividad vial real.
- `snaps_m` no se calcula desde coordenadas reales.
- El control de procedencia y el comparador son módulos separados; no existe todavía un orquestador de aprobación conjunta con raíz de confianza.
- Los umbrales de distancia son provisionales; **`commercialQuoteEnabled=false`**.

No se descargó cartografía, ejecutó OSRM, creó cuentas, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción.
