# Auditoría de integridad y carrera de escritura — 2026-11-15

Referencia: `1d4fb44c37945b32a624057a5dbd3a72a1692cef`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Fuente GitHub comprobada
Se consultaron el verificador `tests/verify-havana-offline-source-bundle.py` (blob Git `1130338c88d03ab5019a891500a61da5c9d1fd10`) y la batería `tests/test-havana-offline-source-bundle.py` (blob `e4a616617edb8a921f3cd091a5196e8b979267e2`). Ambos preservan los SHA-1 Git y SHA-256 independientes de los tres archivos fuente. La consulta del conector no materializa automáticamente los bytes en el contenedor.

## Evidencia ejecutada localmente
Se creó un ensayo sintético de la secuencia `os.open(dir_fd=...)`, `os.fstat`, lectura y `os.fstat` en `/mnt/data/ed_fd_verify/concurrent_write_probe.py`. El ensayo abre un archivo regular, toma `fstat`, ejecuta una escritura **sobre el mismo inode** por otro descriptor abierto con `r+b`, sincroniza mediante `fsync`, lee y compara tamaño, mtime_ns y ctime_ns. El archivo pasa de `original` a `CHANGED!`, de igual longitud.

Comandos y salidas:
```text
$ python /mnt/data/ed_fd_verify/concurrent_write_probe.py
PASS in-place same-inode write detected after pre-read fstat
normal_exit:0

$ python -O /mnt/data/ed_fd_verify/concurrent_write_probe.py
PASS in-place same-inode write detected after pre-read fstat
optimized_exit:0
```

El ensayo reproduce el mecanismo de metadatos, **no ejecuta el verificador real del repositorio**. No prueba cambios con mtime/ctime restaurados, modificaciones con tiempos indistinguibles, escrituras posteriores a la última lectura ni consistencia de una instantánea multiarc​hivo.

## Bloqueo de reproducción exacta
En este turno no se ha conseguido materializar los seis archivos exactos del conector GitHub en el contenedor; por ello **no se han calculado hashes locales nuevos de esos seis archivos ni ejecutado la batería integral de 20 ataques en Python normal y -O**. No se reutilizan los PASS de otros turnos como si fueran nuevos resultados. No se modificó el verificador: no hay un fallo nuevo comprobado en el código GitHub que justifique modificarlo.

**NO-GO CI.** GitHub Actions permanece deshabilitado; no se ejecutaron workflows, no se descargó cartografía y no se accedió a Supabase, staging ni producción.
