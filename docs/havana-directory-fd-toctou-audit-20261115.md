# Auditoría final TOCTOU del lector offline — 2026-11-15

Base `4ace89fb8662fe540386fd9c839e8f2bc7cc32fa`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Hallazgo y cambio
El lector anterior hacía `lstat` sobre rutas y después `os.open` sobre el nombre completo; esto deja una carrera entre la comprobación de directorios padres y su apertura. El lector actualizado abre la raíz y cada componente sucesivamente con `O_DIRECTORY|O_NOFOLLOW`, luego el archivo con `O_NOFOLLOW|O_NONBLOCK`, usando `dir_fd` y descriptores anclados. Se conservan el control de archivos regulares, `st_nlink==1`, tamaño máximo, comparación de metadatos antes/después, SHA Git y SHA-256 independientes. La batería GitHub se adaptó a `os.open(...,dir_fd=...)`. En la carrera de sustitución de directorio, el comportamiento esperado ya no es un rechazo obligatorio: se exige que el descriptor lea el **archivo original**, nunca el archivo alterado introducido en la ruta.

## Evidencia ejecutada
Se ejecutó localmente un **ensayo sintético del lector de descriptores** en `/mnt/data/ed_fd_audit/test.py`, no el conjunto completo de fuentes GitHub. Salida de `python /mnt/data/ed_fd_audit/test.py` (exit 0):
```
PASS baseline
PASS symlink leaf denied
PASS symlink parent denied
PASS anchored parent replacement reads original inode
```
La misma salida se obtuvo con `python -O /mnt/data/ed_fd_audit/test.py` (exit 0). El ensayo realiza una sustitución determinista de `tests/` por un directorio con contenido `tampered` después de abrir su descriptor y antes de abrir `a`; el contenido leído fue `original`. Las pruebas de symlink de hoja y padre devolvieron `OSError` como se esperaba.

**Alcance de la evidencia:** cuatro pruebas sintéticas por modo; no se afirma que la batería integral de 20 ataques haya sido reejecutada después de este cambio. Tampoco se afirma que el archivo sintético sea idéntico a la fuente GitHub. El entorno local actual no conserva el paquete exacto del turno anterior. Los SHA-256 originales siguen fijados en el verificador y el lockfile, sin cambios.

## Riesgos residuales
- Una raíz sustituida *antes* de abrir el descriptor puede ser otra raíz; los hashes siguen obligando a identidad de contenidos, pero no acreditan la identidad del directorio físico.
- Los descriptores anclan nombres frente a renombrados; no impiden escrituras sobre un inode ya abierto. Se compara tamaño, mtime, ctime y hash, pero no se promete instantánea atómica frente a un escritor malicioso.
- `O_NOFOLLOW`, `O_DIRECTORY` y `dir_fd` requieren soporte del sistema operativo; el prototipo está orientado a Linux. No se ha comprobado en runner GitHub.
- El uso de `os.dup` con `fdopen` no ejecuta contenido; el verificador continúa en solo lectura.

## Decisión
Mantener **NO-GO para CI**. Workflows originales sin cambios: `on: {}`, `if: ${{ false }}`, `permissions: {}` y flags comerciales apagados. No se ejecutaron GitHub Actions, no se descargó cartografía ni se accedió a Supabase, staging o producción. Antes de considerar aprobación: reconstruir los bytes exactos en el contenedor, reejecutar la batería integral en Python normal y `-O`, y registrar hashes y códigos de salida.
