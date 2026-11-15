# Integración offline de controles sintéticos — 2026-11-15

**Repositorio:** `Liuben810921/enlace-digital`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `a3886f15a5d932997f645462a0b35c6009820e4e`  
**Commit de código:** `e8e4000e33018b0ef201ef2216d8fde0c5792536`

## Implementación

Se añadieron `experiments/havana-osrm-portable/synthetic_gate.py` y `test_synthetic_gate.py`. El orquestador llama primero a `provenance_gate.validate_manifest`; si falla, no intenta comparar rutas. Si pasa, llama a `compare_graphs_v2.validate`. Reporta por separado `integrity`, `coverage` y `equivalence`. Toda excepción controlada produce rechazo (`accepted_for_synthetic_review=false`).

La salida distingue `accepted_for_synthetic_review` de `commercial_approval` y `commercial_quote_enabled`. Los dos últimos campos son siempre `false`; la revisión sintética no autoriza uso comercial ni valida cobertura geográfica real. `coverage.geographic_verified=false` incluso con resultados sintéticos positivos.

## Evidencia local sobre archivos exactos

Se cotejó `git hash-object` local con el SHA-1 blob devuelto por GitHub para ambos archivos nuevos. Los cinco módulos históricos ya habían sido comprobados en el commit base y se conservaron sin modificaciones.

| Archivo nuevo | SHA-1 Git blob coincidente | SHA-256 copia exacta |
|---|---|---|
| `synthetic_gate.py` | `67f1725895aa4d10bc841b09540d788479f2c855` | `7b3f77b6d08f89d8fbda385b4ac559f5948be5d67a5e7394a02a58378da45871` |
| `test_synthetic_gate.py` | `8b737215181978baf18e81785041eda7bd1a94c0` | `fc78cab5e5c626aeb0c9bdb1317fe0e11149cd716bfceeee6e3ae44af8332a53` |

Se detectó y corrigió **solo en la copia local** una divergencia de formato (una línea en blanco adicional en el archivo publicado); tras reconstruir la copia exacta, los SHA-1 coincidieron. El archivo GitHub no necesitó modificación.

## Pruebas

```sh
cd experiments/havana-osrm-portable
python -m unittest -q test_compare_graphs_v2 test_adversarial_v2 test_provenance_gate test_synthetic_gate
python -O -m unittest -q test_compare_graphs_v2 test_adversarial_v2 test_provenance_gate test_synthetic_gate
```

Resultado observado sobre copias exactas: **91/91 OK** en Python normal y **91/91 OK** en `-O`. Son 75 pruebas históricas más 16 adversariales de orquestación. Se comprobaron: manifiesto manipulado, JSON inválido, integridad correcta con comparación inválida, pérdida de conectividad, deriva, snapping, sesgo, corpus exterior y rechazo comercial permanente.

## Limitaciones

- La integridad de hashes no autentica al productor sin una raíz de confianza.
- Los conteos de cobertura son declaraciones sintéticas; no hay comprobación geográfica real.
- No existe aprobación comercial; `commercialQuoteEnabled=false` en el diseño.
- No se ejecutó GitHub Actions ni se verificó su estado; los resultados son exclusivamente locales.
- El orquestador no está integrado en la aplicación web ni en ningún servicio operativo.

No se descargó cartografía, ejecutó OSRM, creó cuentas, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción.
