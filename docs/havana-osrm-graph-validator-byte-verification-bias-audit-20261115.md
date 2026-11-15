# Verificación de copias exactas y auditoría de sesgo, cobertura y snapping — 2026-11-15

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit base:** `bd2624c016fb262ae6d540c49bf0dee9d9624794`

## 1. Verificación de identidad de bytes

Se recuperó el contenido de los dos archivos mediante el conector de GitHub apuntando al commit fijo y se reconstruyeron copias locales UTF-8. La descarga directa de raw.githubusercontent.com no funcionó por falta de resolución DNS, por lo que la ruta de recuperación fue el conector autenticado.

| Archivo | SHA-1 Git blob del conector | SHA-1 Git blob local | SHA-256 independiente local |
|---|---|---|---|
| `compare_graphs.py` | `407ac1e8359e2d9126dc324b4ba62264a1e921e5` | `407ac1e8359e2d9126dc324b4ba62264a1e921e5` | `c58e956a4e3b6cf9346c763ae89ed6fbe48a75f2a08ddf655215ced24f630f75` |
| `test_compare_graphs.py` | `be6554eac8fb6067c5df2f4b27e63906e0009d6e` | `be6554eac8fb6067c5df2f4b27e63906e0009d6e` | `2a0aff305142137121bd12f15952f6a3d79ef4e19ab8fe11e372ffe4fdb3e0e0` |

Los SHA-1 coincidentes verifican identidad de objetos Git bajo el modelo de hash de Git; SHA-256 es una medición independiente sobre las copias locales. No se obtuvo SHA-256 directo de un blob binario descargado por HTTPS; no afirmar esa comprobación adicional.

**Pruebas ejecutadas sobre copias con SHA-1 coincidente:**
- `python -m unittest -q test_compare_graphs`: **27/27 OK**.
- `python -O -m unittest -q test_compare_graphs`: **27/27 OK**.
- No fue necesario modificar los dos archivos originales: no hubo divergencia de bytes ni fallos de pruebas.
- No se activó GitHub Actions; los resultados son locales, no CI.

## 2. Auditoría adversarial adicional (análisis estático del código publicado)

**Sesgo:**
- `all_distances_increase` se dispara únicamente si *todos* los `diffs` calculados son positivos. Un corpus con 99 rutas que aumentan 1 m y una que disminuye 1 m evita esa alarma. Esto no implica que el resultado pase si alguna ruta excede 100 m o 2 %; muestra una laguna en detección de sesgo colectivo.
- Los `diffs` de casos con pérdida de conectividad o snapping inválido no se incluyen en la comprobación agregada; estos casos sí fallan individualmente.
- No se calculan media/mediana de diferencias, percentiles ni ponderación por impacto tarifario. No debe utilizarse el resultado `accepted` como garantía de ausencia de sobrecobro.

**Cobertura:**
- Los casos con `in_coverage=false` no se evalúan para equivalencia, salvo validación de esquema. Se necesita un corpus separado de límites, almacenes extremos y salidas/reentradas.
- Los casos de referencia con `NoRoute`, `NoSegment` o `Timeout` no se evalúan como equivalencia; el validador rechaza la aceptación vacía si no hay ningún `Ok` dentro de cobertura, pero **un caso válido puede ocultar varios casos de referencia fallidos**.
- El campo `in_coverage` lo suministra el llamante: no hay comprobación geográfica, ni de conectividad de red ni de validez de coordenadas.

**Snapping:**
- Se compara un único valor `snap_m` por ruta, aunque las rutas reales tienen **dos extremos**; no garantiza que ambos extremos estén dentro del límite.
- El `snap_m` se declara por el productor de datos, no se recalcula de coordenadas originales y ajustadas. Falta control de consistencia y procedencia.
- Un límite de 30 m en pruebas es un parámetro sintético, **no** una política aprobada de negocio.
- Un valor numérico extremadamente grande pero finito se acepta por esquema y solo se rechaza al evaluar un caso elegible.

**Umbrales:**
- Para rutas elegibles exige `delta <= 100 m` **y** `delta/baseline <= 0.02`. En rutas cortas el criterio relativo puede ser mucho más estricto que 100 m.
- Los umbrales son constantes en código; todavía no son política aprobada ni medición de exactitud real.

## 3. Recomendación técnica siguiente
Mantener este validador como prototipo sintético, no como autorización para tarifas. En revisión posterior aislada: introducir esquema explícito de endpoints con coordenadas originales/ajustadas y distancias de snapping independientes; separar `coverage_audit` de `route_equivalence`; cuantificar sesgo agregado por rutas y por bandas de distancia; incluir recuentos por estado de referencia; no aceptar muestras con fallos de cobertura ocultos. Añadir pruebas que demuestren los falsos negativos antes de endurecer el algoritmo.

## 4. Límites
No se descargó cartografía, ejecutó OSRM, creó cuenta, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción. `commercialQuoteEnabled=false`.
