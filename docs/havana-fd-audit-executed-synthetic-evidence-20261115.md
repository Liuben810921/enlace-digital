# Auditoría offline del lector por descriptores — evidencia ejecutada 2026-11-15

Base: `f50b5641b2a268a3fc32d2264ebe151c50c02897`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Fuentes inspeccionadas
Se recuperaron mediante el conector GitHub los textos y los hashes de objeto Git de `tests/verify-havana-offline-source-bundle.py` (`1130338c88d03ab5019a891500a61da5c9d1fd10`), `tests/test-havana-offline-source-bundle.py` (`e4a616617edb8a921f3cd091a5196e8b979267e2`) y `tests/fixtures/havana-offline-source-bundle-lock.json` (`cdc2835ccbbc8f83256418580de751ea882a88e3`). El verificador contiene constantes Git SHA-1 y SHA-256 para los tres archivos cartográficos. **No se reconstruyeron ni verificaron localmente los seis archivos exactos en esta ejecución.**

## Ejecución real y límites
Se creó en `/mnt/data/ed_fd_verify/probe.py` una reproducción **sintética e independiente** del patrón `os.open(dir_fd=..., O_NOFOLLOW)`, para ensayar el aislamiento de descriptores. No es el verificador completo del repositorio y sus resultados **no equivalen a 20/20**.

Primer intento:
- `python probe.py`: exit 0.
- `python -O probe.py`: exit 1, porque el propio ensayo utilizaba `assert` con efectos laterales y Python optimizado omitió una llamada. Este fallo correspondía al **ensayo sintético**, no al verificador GitHub.
Se corrigió el ensayo local reemplazando los `assert` con llamadas obligatorias a `require`, sin modificar código GitHub.

Repetición corregida:
- `python /mnt/data/ed_fd_verify/probe.py`: **exit 0**.
- `python -O /mnt/data/ed_fd_verify/probe.py`: **exit 0**.

Salida de ambos modos:
```
PASS baseline
PASS leaf symlink blocked
PASS parent symlink blocked
PASS parent replacement anchored to original
PASS pre-open leaf replacement blocked
OBSERVED pre-open in-place rewrite returns modified bytes; pinned hash required
```

El último caso es un hallazgo relevante: una modificación **antes** de abrir el archivo puede producir bytes alterados válidamente leídos; la identidad del contenido debe validarse después contra los hashes fijados. El anclaje por descriptor no convierte el contenido en inmutable.

## Pendientes y decisión
- **No ejecutada**: batería integral de 20 mutaciones del repositorio, ni normal ni `-O`, contra bytes exactos de GitHub. No se afirma su aprobación.
- **No ejecutada**: prueba determinista de escritura sobre el mismo inode *durante* la lectura; requiere instrumentar el lector real y registrar el comportamiento.
- Pendiente: materializar y comprobar localmente SHA-1 Git y SHA-256 de los archivos exactos antes de repetir la batería.
- Riesgo residual: `O_NOFOLLOW` y `dir_fd` bloquean redirecciones por symlink pero no impiden cambios de contenido sobre un inode abierto. El hash posterior es indispensable.
- **NO-GO** para CI. No se modificaron los workflows, no se activaron GitHub Actions, no se descargó cartografía y no se accedió a Supabase, staging ni producción.
