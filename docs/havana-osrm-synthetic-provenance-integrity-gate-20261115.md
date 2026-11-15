# Procedencia e integridad de corpus sintético OSRM — 2026-11-15

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `7494d685a1c24890dc0a26deac8b4330b9eb209e`  
**Commit de código:** `aeaec9ff139fa88502f999da98483810f472ada7`

## Entregables

- `experiments/havana-osrm-portable/provenance_gate.py`: esquema cerrado de manifiesto, SHA-256 de JSON canónico (claves ordenadas, UTF-8, separadores compactos), digest independiente de IDs ordenados, número de casos, conteos dentro/fuera de cobertura, rechazo de claves JSON duplicadas y datos no finitos, tamaño máximo de 4 MB por archivo.
- `experiments/havana-osrm-portable/test_provenance_gate.py`: 24 pruebas adversariales sobre alteración de datos, orden, cobertura, hashes, claves duplicadas, tipo booleano, reclamaciones geográficas y límites.
- Se preservan los archivos del comparador v2 y sus 51 pruebas previas.

## Comprobaciones de contenido publicado

| Archivo | Git blob SHA-1 devuelto por GitHub |
|---|---|
| `provenance_gate.py` | `69030499b1f3d78be540237ad5ff6cfea9078871` |
| `test_provenance_gate.py` | `bd99c52fc0ae9f5d32adda216df32aaa3ef83e15` |

Se recuperaron ambos archivos publicados y se confirmó que el archivo de pruebas contiene 24 métodos `test_`. **No se ha comprobado aún igualdad de SHA-1 con copias locales de estos archivos publicados, ni se ha calculado SHA-256 de las copias exactas publicadas.**

## Ejecución local y alcance de la evidencia

Una **implementación local anterior y funcionalmente equivalente**, no idéntica en bytes a los archivos publicados, superó:
- `python -m unittest -q`: **24/24 OK**.
- `python -O -m unittest -q`: **24/24 OK**.

SHA-256 de implementación local: `e4aa641480cb00593e3ae7d234d57887ea32fd2153c366cdd8f77f44ff828ac7`; SHA-256 de pruebas locales: `e62d469e7ffb343ccad90a5925eeb3438f28090b3ed1b42ce952fd971cd7ffd3`. **No corresponden a los archivos publicados.** Los 51 casos anteriores tampoco se reejecutaron en esta etapa. Queda pendiente una regresión conjunta de 75 pruebas sobre copias exactas y el cotejo de hashes.

## Garantías y límites

- `integrity_verified=true` significa que el contenido coincide con los hashes declarados por el propio manifiesto. **No autentica al productor**: un atacante capaz de sustituir corpus y manifiesto puede recalcular los hashes.
- `synthetic_coverage_counts_verified=true` comprueba únicamente consistencia de declaraciones. `geographic_coverage_verified=false` siempre; no se afirma verificación de polígonos ni topología.
- El gate de procedencia es independiente: no ejecuta automáticamente `compare_graphs_v2.validate`. Para un flujo de aprobación futuro deben exigirse **ambos** controles, con fallo cerrado y un mecanismo confiable para anclar los hashes.
- El `producer` es una etiqueta no autenticada; no existe firma digital, cadena de custodia ni clave confiable.
- Sin cartografía real, OSRM ni validez comercial. `commercialQuoteEnabled=false`.

## Restricciones

No se descargó cartografía, ejecutó OSRM, creó cuentas, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción.
