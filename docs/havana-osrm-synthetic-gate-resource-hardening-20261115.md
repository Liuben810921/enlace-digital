# Auditoría offline de resistencia y entradas hostiles — 2026-11-15

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `9c6c8035721950398129f7bb41d370f907d9b58c`  
**Commit de código y pruebas:** `3c9e33e5987060b6b78f674b38585c38c36a000b`

## Riesgo comprobado y corrección

El orquestador original permitía un manifiesto de hasta 4 MB y un corpus de hasta 4 MB **por separado**; por ello podían atravesar el punto de entrada casi 8 MB de datos, antes de decodificar y calcular hashes. Se introdujo en `synthetic_gate.evaluate` una validación **previa a cualquier parseo** que exige `type(x) is bytes` en ambas entradas y `len(manifest_raw)+len(corpus_raw) <= 4_000_000`. Cualquier incumplimiento retorna rechazo sintético sin intentar el análisis.

## Pruebas y verificación

Se añadieron 12 pruebas en `test_resource_gate.py`: límite agregado y límite exacto, entradas individuales grandes, JSON anidado, entero decimal de 100 000 dígitos, surrogate escapado, UTF-8 inválido, `memoryview`, `bytearray` y caso válido de control.

Regresión local sobre los archivos exactos: **115/115 OK** tanto en Python normal como en `python -O` (103 pruebas previas + 12 nuevas).

```sh
python -m unittest discover -p 'test_*.py' -q
python -O -m unittest discover -p 'test_*.py' -q
```

SHA-1 Git de las copias locales, cotejados con GitHub:
- `synthetic_gate.py`: `04d3e7261f01ce9c0b82b8fae1cd9f5507b8fa5e`
- `test_resource_gate.py`: `008654c82956af103082c4a167e19eadc91b6594`

SHA-256 de las copias locales exactas:
- `synthetic_gate.py`: `88510b4a6e4dd04bafb3b8cc5f558c0217fd96f5cce8d89f9b472ac1b954b17b`
- `test_resource_gate.py`: `ab36c5733ed4fb16310c8555b7d7d703370075dd9573524c58ddc00108bbfd03`

## Alcance y límites

El límite agregado reduce la superficie de agotamiento por tamaño de entrada, pero no establece cuotas estrictas de CPU, memoria ni tiempo de ejecución, ni protección contra todos los ataques de complejidad algorítmica. El parser JSON de Python puede rechazar profundidad excesiva mediante `RecursionError`, controlado por el orquestador. `MemoryError` y errores fatales de proceso no se capturan ni se consideran mitigados. La autenticidad de la procedencia y la cobertura geográfica real permanecen sin verificar.

`commercial_approval=false` y `commercial_quote_enabled=false` permanecen invariables; no se autoriza cotización comercial.

**Restricciones:** sin descargas de cartografía, ejecución OSRM, creación de cuentas, activación manual de GitHub Actions, costos ni acceso a Supabase, staging o producción. No se afirma ejecución de CI remoto.
