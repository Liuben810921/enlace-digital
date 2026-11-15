# Estado de transferencia exacta y 21 pruebas — 2026-11-15

Commit de referencia: `cae9b0a80404a6e950b50d7a118f44034336eed0`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Comprobaciones efectuadas
Se reabrieron con el conector GitHub los tres archivos de control en el commit de referencia:
- `tests/verify-havana-offline-source-bundle.py`: blob SHA-1 Git reportado `1130338c88d03ab5019a891500a61da5c9d1fd10`.
- `tests/test-havana-offline-source-bundle.py`: blob SHA-1 Git reportado `29ca5bf035b03801f0ab503d0ba348d803fdce60`.
- `tests/fixtures/havana-offline-source-bundle-lock.json`: blob SHA-1 Git reportado `cdc2835ccbbc8f83256418580de751ea882a88e3`.

Se inspeccionó el final de la batería y se confirmó que contiene una inyección determinista mediante `os.dup` para modificar el mismo inode entre `fstat` y lectura, con rechazo esperado y restauración posterior. El conteo previsto es 21 ataques (20 anteriores más uno), **no un resultado de ejecución**.

Se examinó el contenedor local mediante listado de `/mnt/data`. Solo aparecieron archivos de ensayos sintéticos previos, no el paquete exacto de seis archivos. Se consultaron las acciones disponibles: el conector GitHub recupera texto o base64, pero su respuesta no crea automáticamente archivos en el contenedor. No se encontró una acción autorizada que transfiera directamente el resultado del conector al sistema de archivos del contenedor sin intervención manual o Internet público.

## Resultados que NO se atribuyen
- **No ejecutadas**: 21 pruebas adversariales con Python normal.
- **No ejecutadas**: 21 pruebas adversariales con Python `-O`.
- **No calculados localmente en este turno**: hashes SHA-1 Git y SHA-256 de los seis archivos exactos.
- **No ejecutada en este turno**: prueba de escritura concurrente de la batería real.
- No se documentan stdout ni códigos de retorno inexistentes.

## Siguiente paso seguro
Materializar los seis archivos exactos mediante una vía aprobada que preserve bytes, comparar `git hash-object` con los seis blob SHA-1 Git del conector y calcular SHA-256 locales. Solo después ejecutar `python tests/verify-havana-offline-source-bundle.py .`, `python -O ...`, `python tests/test-havana-offline-source-bundle.py .` y `python -O ...`, registrando salidas y códigos de retorno.

**NO-GO para GitHub Actions**. No se activaron workflows ni se accedió a Supabase, staging o producción. No se descargó cartografía.
