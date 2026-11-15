# Regresión integral exacta OSRM v2 — 2026-11-15

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit base:** `b33f3dc9502196c30daef5abe7b4795ddf0ed544`  
**Resultado:** **51/51 OK** en Python normal y **51/51 OK** con `python -O`. Sin divergencias ni correcciones de código necesarias.

## Identidad de los archivos ejecutados

Se recuperaron los archivos desde GitHub en el commit fijo. Las copias exactas preexistentes en el entorno local se reunieron en `/mnt/data/osrm-regression`; se calculó `git hash-object` y `sha256sum` de cada copia. Todos los SHA-1 Git coinciden con los blob SHA comunicados por GitHub.

| Archivo | Git blob SHA-1 coincidente | SHA-256 de copia local |
|---|---|---|
| `compare_graphs_v2.py` | `a90dc87d622901ee22b6a6116d50ce5ae8a4e35f` | `5af9c6749340787b8c6f2cb8dd990052852dfbec30af7e110ae341af52fb17e8` |
| `test_compare_graphs_v2.py` | `705ebee25e07308546426d312a90321efbf0bc25` | `e424970acf8325269a22b57db63bfa169220c88eaf1a29bc39d621ea2584ab12` |
| `test_adversarial_v2.py` | `a0236a9af63c10745f61be18a1ed27b00ee3ac9b` | `3e2f32bbb9d087d8842f77ed8341fc43e7ab650ab330bcdf51a571a8226a7f9f` |

## Ejecución reproducible

Desde el directorio que contiene los tres archivos:

```sh
python -m unittest -q test_compare_graphs_v2 test_adversarial_v2
python -O -m unittest -q test_compare_graphs_v2 test_adversarial_v2
```

Salida observada:

```text
----------------------------------------------------------------------
Ran 51 tests in 0.016s

OK
----------------------------------------------------------------------
Ran 51 tests in 0.015s

OK
```

43 pruebas históricas y 8 adversariales incluidas en cada ejecución. No hubo fallos, errores, omisiones ni divergencias de SHA-1 Git. No se modificó el validador.

## Alcance y restricciones

La evidencia demuestra regresión local del comparador sintético, no precisión de rutas OSRM reales, validez de polígonos de cobertura, ni condiciones de un proveedor gratuito. `commercialQuoteEnabled=false`. No se descargó cartografía, ejecutó OSRM, creó cuentas, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción. No se afirma estado CI verde.
