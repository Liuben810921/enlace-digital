# Verificación reproducible exacta de comparador OSRM v2 — 2026-11-15

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit verificado:** `d33f705336d008fe60efacdad5001c68e057b8ff`  
**Método:** lectura mediante conector GitHub fijada a commit, reconstrucción byte a byte de ambos contenidos UTF-8 en entorno local, comparación de Git blob SHA-1 calculado localmente con identificador de objeto GitHub, cálculo SHA-256 y ejecución local de las pruebas. La descarga directa de raw.githubusercontent.com falló por DNS; no se usó como fuente.

## Archivos y hashes comprobados

| Archivo | Bytes | SHA-1 GitHub = SHA-1 Git blob local | SHA-256 local |
|---|---:|---|---|
| `experiments/havana-osrm-portable/compare_graphs_v2.py` | 3346 | `0083d687710b38b5b608766508797527d526c40c` | `5ce6c2fddc36a242a0e70eb611c097f93698afd9310701f96b4dcc89c89110aa` |
| `experiments/havana-osrm-portable/test_compare_graphs_v2.py` | 5206 | `705ebee25e07308546426d312a90321efbf0bc25` | `e424970acf8325269a22b57db63bfa169220c88eaf1a29bc39d621ea2584ab12` |

Git blob SHA-1 calculado como `SHA1(b'blob ' + str(len(content)).encode() + b'\\0' + content)`. Se contrastó el identificador resultante con el `sha` devuelto por GitHub para cada archivo en el commit fijo. Los SHA-256 se calcularon de las copias reconstruidas, no fueron valores suministrados por GitHub.

## Resultados reproducidos sobre copias exactas

Directorio local temporal `/mnt/data/osrm-v2-check`; se usaron exactamente los nombres de archivos publicados y sus importaciones originales.

```text
python -m unittest -q test_compare_graphs_v2
Ran 43 tests in 0.014s
OK

python -O -m unittest -q test_compare_graphs_v2
Ran 43 tests in 0.014s
OK
```

**Resultado: 43/43 normal y 43/43 con -O.** No se encontraron divergencias de contenido ni fallos; no hubo necesidad de modificar código. Esto verifica los dos archivos publicados en el commit indicado, no un build OSRM ni el estado de GitHub Actions.

## Límites y conclusión

El comparador es sintético: la validación de `snaps_m` depende de valores declarados, sin comprobación geográfica; `in_coverage` no se verifica contra polígonos; el sesgo positivo neto es una alarma conservadora, no una prueba estadística; las distancias y umbrales 100 m / 2 % no han sido calibrados para La Habana. **No autoriza cotización comercial**, `commercialQuoteEnabled=false`.

No se descargó cartografía, ejecutó OSRM, creó cuenta, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción. No se inspeccionó el estado de workflows automáticos.
