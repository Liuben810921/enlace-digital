# Integridad exacta y prueba de carrera del mismo inode — 2026-11-15

Base: `17f99e602bf82f3d10237c935552d95f7332aecb`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Recuperación GitHub y limitación
Se inspeccionaron mediante el conector GitHub el verificador Python, la batería adversarial y los tres objetos fuente, utilizando el commit fijado. La API del conector permite leer el contenido en UTF-8 o base64 y devuelve su blob SHA Git; **no proporciona en este entorno un destino de materialización local**. La salida del conector no se transfiere automáticamente al sistema de archivos del contenedor. No se ha completado la reconstrucción verificable de los seis archivos exactos, por lo que **no se han ejecutado aquí las 20 pruebas integrales anteriores** ni puede afirmarse un PASS sobre los bytes GitHub.

## Cambio realizado
Se añadió a `tests/test-havana-offline-source-bundle.py` una prueba determinista adicional: intercepta `os.dup` después del primer `fstat` del archivo objetivo y antes de la lectura, modifica un byte del mismo inode mediante otro descriptor con `r+b`, ejecuta `flush` y `fsync`, y exige que `verify` falle cerrado. Restaura el contenido en la copia temporal. Se preservan todos los SHA-1 y SHA-256 fijados y las restricciones de red y ejecución. **21 casos definidos**, no 21 aprobados.

## Ejecución local real
Se ejecutaron dos ensayos independientes y sintéticos con `tempfile.TemporaryDirectory`, `os.open(O_NOFOLLOW)`, `os.fstat`, escritura `r+b`, `fsync`, lectura y nuevo `fstat`. La escritura sustituyó `original` por `Changed!` en el mismo inode.

- Python normal: stdout `PASS synthetic in-place rewrite detected; exit 0`; código de salida **0**.
- Python `-O`: stdout `PASS synthetic in-place rewrite detected -O; exit 0`; código de salida **0**.

Ambos ensayos observaron inode constante y `ctime_ns` cambiado. El primero utilizó `assert` en un proceso normal; el segundo validó explícitamente mediante `if/raise` en modo optimizado. **No constituyen ejecución de la prueba GitHub nueva** ni garantizan la detección de toda escritura concurrente posible.

## Pendientes
1. Materializar los seis archivos exactos del conector al contenedor por una vía autorizada, verificar blob SHA-1 Git y SHA-256 local de cada uno.
2. Ejecutar verificador y batería de **21** casos en Python normal y `-O`; registrar stdout, stderr y códigos de salida.
3. Revisar adicionalmente sustituciones de directorio y escrituras durante la lectura, no solo antes de ella.
4. Mantener **NO-GO CI**: GitHub Actions deshabilitado, sin cartografía descargada y sin acceso a Supabase, staging ni producción.
