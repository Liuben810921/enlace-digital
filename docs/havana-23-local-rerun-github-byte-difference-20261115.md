# Reejecución offline y procedencia de bytes — 2026-11-15

Base: `d4c38f5aaa11e0228bd088ed8726dd0b86e7f877`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Recuperación y comparación
Se consultaron mediante el conector GitHub ambos archivos Python con codificación base64. Se inspeccionó la copia local existente en `/mnt/data/ed_verified_bundle/tests`. No se realizó transferencia directa de bytes entre el conector y el contenedor: **no se afirma una sincronización exacta del archivo de pruebas**.

| Archivo | Git blob SHA-1 devuelto por GitHub | SHA-1 Git calculado localmente | SHA-256 calculado localmente | Estado |
|---|---|---|---|---|
| `verify-havana-offline-source-bundle.py` | `e17c0cf35fa0efd0e771e6ace69aadec5bb4f274` | `e17c0cf35fa0efd0e771e6ace69aadec5bb4f274` | `c1341e3151f4f2ceb7456caa4bc068d197e9a59360629332b0b881cecef1339f` | EXACTO |
| `test-havana-offline-source-bundle.py` | `dfa6696eaa74caeadc0b9814e7063d63f6662601` | `d937fe12b189cbf2663fcea61e83ebe04676a549` | `1b3a6b814ce28b711667f024a5ca4a8af93906f00a2032c1be0a633a043a7840` | DIFERENTE |

## Cuatro ejecuciones realmente efectuadas
Con `sys.executable` y `subprocess.run(..., capture_output=True, text=True, timeout=30)`, tomando `/mnt/data/ed_verified_bundle` como BUNDLE:

| Modo | stdout exacto sin salto final | stderr | exit |
|---|---|---|---:|
| Verificador normal | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| Verificador `-O` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| Batería local normal | `PASS offline bundle adversarial: 23` | vacío | 0 |
| Batería local `-O` | `PASS offline bundle adversarial: 23` | vacío | 0 |

Las 23 pruebas incluyen inyección de escritura sobre el mismo inode, symlink en ancestro y limpieza de descriptores. **No se ha ejecutado byte a byte la batería publicada en GitHub.** No se han ejecutado en este turno otras pruebas nuevas de sustitución de raíz o escritura concurrente diferentes de las 23 existentes.

## Riesgos residuales
El lector utiliza descriptores anclados desde `/` y `O_NOFOLLOW` en cada componente, pero las sustituciones concurrentes de directorios pueden cambiar la semántica del camino de acceso sin redirigir el descriptor abierto. La validación de contenido SHA-1 Git y SHA-256 sigue siendo obligatoria. Una modificación del mismo inode después de la comprobación de integridad queda fuera del alcance de esta ejecución.

**NO-GO operativo.** No se activaron GitHub Actions; no hubo acceso a Supabase, staging ni producción.
