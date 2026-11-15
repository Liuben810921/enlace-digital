# Endurecimiento offline del comparador OSRM — 2026-11-15

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `4d0af720425491449fbd6c2df477d41011a5fdc4`  
**Último commit de código:** `ef2e37fd63e7a81f362df871da6172e93f44c560`

## Archivos incorporados
- `experiments/havana-osrm-portable/compare_graphs_v2.py` (SHA-1 Git blob verificado por conector: `0083d687710b38b5b608766508797527d526c40c`).
- `experiments/havana-osrm-portable/test_compare_graphs_v2.py` (SHA-1 Git blob verificado por conector: `705ebee25e07308546426d312a90321efbf0bc25`; contiene 43 métodos `test_`).

Los archivos originales v1 se conservan para comparación y reversión.

## Cambios funcionales
1. `snaps_m` contiene exactamente dos distancias finitas no negativas, origen y destino, para cada resultado baseline/candidate. Se generan alarmas diferenciadas por extremo y lado.
2. Se separan `coverage_audit` y `route_equivalence`; se contabilizan estados de referencia/candidata. Un fallo de baseline dentro de cobertura ya no queda oculto por otro caso válido.
3. Los casos fuera de cobertura quedan registrados en contadores, pero no se usan para aprobar equivalencia interior.
4. Se calcula suma de aumentos, suma de disminuciones y variación neta con `math.fsum`. Cualquier variación neta positiva dispara `positive_net_distance_bias` aunque existan signos opuestos. Es **alarma conservadora**, no prueba estadística de sobrecobro.
5. Se mantienen umbrales experimentales de 100 m y 2 % simultáneos; no están aprobados para tarifas reales.
6. Validación estricta de esquema, duplicados JSON, NaN, Infinity, booleanos numéricos, casos duplicados y límite de 4 MB.

## Pruebas
Una implementación local equivalente de v2, con código formateado distinto, superó **43/43** pruebas en Python normal y **43/43** con `python -O`. Sus hashes SHA-256 locales fueron `5ecea408f7257f7def739b9b4054d9f220407771502639527f6f9e2edd6c4e64` (validador local) y `a0385e5e3b6b8c301bf834389167e4bd4cef8703f6e5a2b6eb26a928ea97ea0b` (pruebas locales). **Estos hashes NO identifican los archivos publicados**, que se redactaron con el mismo comportamiento pero formato diferente.

Se recuperaron ambos archivos publicados mediante el conector GitHub y se verificaron los SHA-1 blob anteriores y la presencia de 43 métodos de prueba. **No se reejecutaron las copias exactas publicadas ni se calculó su SHA-256 independiente en esta etapa**; no afirmar CI verde ni igualdad de bytes entre la implementación local y la publicada. Para cerrar esa comprobación, recuperar ambos blobs en el mismo entorno Python y ejecutar `python -m unittest -q test_compare_graphs_v2` y `python -O -m unittest -q test_compare_graphs_v2`.

## Limitaciones restantes
No se calculan snapping a partir de coordenadas, validez geográfica, sesgo estadístico robusto, impacto monetario, conectividad topológica, rutas reales ni recursos OSRM. Los datos sintéticos son declaraciones del productor. No hay evidencia de precisión de distancias en La Habana. `commercialQuoteEnabled=false`.

## Restricciones respetadas
Sin cartografía, ejecución OSRM, cuentas, activación manual de GitHub Actions, costos ni acceso a Supabase, staging o producción. No se verificó estado de workflows automáticos.
