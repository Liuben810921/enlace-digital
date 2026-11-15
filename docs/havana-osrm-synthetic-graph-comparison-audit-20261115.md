# Auditoría y validador sintético de equivalencia OSRM — 2026-11-15

**Rama:** plan/havana-osrm-benchmark-offline-20261114. **Base:** 906092fe38c3c1b16aa17a57d29969e13572c65d.

## Artefactos
- `experiments/havana-osrm-portable/compare_graphs.py`: validador Python puro sin red ni dependencias externas.
- `experiments/havana-osrm-portable/test_compare_graphs.py`: 27 pruebas sintéticas y adversariales.

**Ejecución reproducible desde el directorio de ambos archivos:**
```sh
python -m unittest -q test_compare_graphs
python -O -m unittest -q test_compare_graphs
```
Se ejecutó la misma lógica localmente (archivos locales llamados `validate.py` y `test_validate.py`, con el import correspondiente): **27/27 OK en Python normal y 27/27 OK con -O**. Las copias publicadas en GitHub no fueron descargadas y reejecutadas después del commit; no se afirma CI verde. Hashes SHA-256 locales originales: validador `063c646d92bbed69bdb517425f0bbaffd36526bf852c83158f1a2f6104265043`; pruebas `4df7686b981870fb694ece14921ddc1878ecb8a29c39b8a2e4f5055702caade4`. Esos hashes corresponden a los **nombres/imports locales**, no a los archivos de GitHub.

## Entrada JSON
Objeto con claves exactas `cases` (1–10000) y `snap_limit_m` (metros, no negativo). Cada caso: `id` único, `in_coverage` booleano, `baseline` y `candidate`, ambos con `code` (Ok/NoRoute/NoSegment/Timeout), `distance_m` (número no negativo si Ok; null si no) y `snap_m` (número no negativo). Se rechazan claves duplicadas, campos extra, NaN, Infinity, booleanos usados como números, distancias negativas y entradas mayores de 4 MB.

## Reglas y hallazgos
1. En casos dentro de cobertura con ruta válida R0, la candidata debe tener ruta válida; NoRoute/NoSegment/Timeout son fallos de conectividad/disponibilidad.
2. Snapping de ambos escenarios debe respetar `snap_limit_m`, parámetro **pendiente de aprobación**.
3. Distancia: diferencias <=100 m **y** <=2 %; baseline cero solo admite candidata cero. Son **umbrales propuestos**, no garantías comerciales.
4. Si todas las diferencias evaluadas son estrictamente positivas, se rechaza como posible sesgo sistemático de aumento.
5. Sin ningún caso R0 válido dentro de cobertura, se rechaza para evitar aprobación vacía.
6. La prueba de casos fuera de cobertura debe evaluarse separadamente: no se usa para demostrar equivalencia interior.

## Limitaciones y deuda técnica
- El detector `all_distances_increase` es una heurística estricta: no detecta sesgo con mezcla de aumentos y reducciones, ni tiene inferencia estadística.
- No verifica conectividad topológica ni geometrías reales, sentidos únicos, restricciones de giro, desviaciones de duración, tamaño de grafo, RAM o rutas que salen y reingresan. Requiere corpus real autorizado y evidencia OSRM futura.
- Un `snap_m` declarado es dato sintético: este validador no calcula distancia geográfica ni autentica la procedencia.
- El validador evalúa únicamente casos elegibles R0 Ok dentro de cobertura. Los errores R0 y los casos fuera de cobertura deben revisarse en una auditoría de cobertura separada.
- El umbral relativo en rutas muy cortas es estricto deliberadamente. Revisar su impacto sobre tarifas antes de aprobar.
- La regla de 'todos aumentan' puede rechazar incluso diferencias pequeñas; es una alarma de revisión conservadora.
- **No hay mediciones de La Habana**, ninguna conclusión sobre 1 GiB RAM ni aprobación de Hostless.

## Restricciones
`commercialQuoteEnabled=false`. Sin cartografía, OSRM, cuentas, GitHub Actions activadas manualmente, costos, Supabase, staging ni producción. No se inspeccionó el estado de workflows automáticos.
