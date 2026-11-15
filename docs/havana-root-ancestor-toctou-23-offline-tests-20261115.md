# Auditoría TOCTOU de raíces, ancestros y descriptores — 2026-11-15

Base: `ea136d1d8c0cb102e935799a05576f073a26b2bc`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Fallo reproducido
Se importó localmente el verificador Python previamente extraído del ZIP de GitHub. Con una ruta cuya **raíz final era un directorio real pero uno de sus ancestros era un symlink**, el lector original aceptó la lectura: `ancestor symlink accepted b'abc'`. La causa fue `os.open(base, O_NOFOLLOW)`: el indicador no protege ancestros de una ruta completa.

## Corrección
`read_regular` ahora obtiene un descriptor de `/` y abre cada componente de la raíz absoluta mediante `os.open(component, O_DIRECTORY|O_NOFOLLOW, dir_fd=fd)`; continúa abriendo del mismo modo los subdirectorios relativos. Conserva comprobaciones `fstat`, SHA-1 Git, SHA-256 y bloqueo offline. No se modificaron los archivos fuente cartográficos ni los hashes fijados.

## Pruebas ejecutadas localmente
Sobre la copia de trabajo del ZIP con el lector corregido y batería ampliada se ejecutó:

```text
python verify-havana-offline-source-bundle.py BUNDLE
PASS offline source bundle: 3 pinned files; no network or execution
exit 0; stderr vacío

python -O verify-havana-offline-source-bundle.py BUNDLE
PASS offline source bundle: 3 pinned files; no network or execution
exit 0; stderr vacío

python test-havana-offline-source-bundle.py BUNDLE
PASS offline bundle adversarial: 23
exit 0; stderr vacío

python -O test-havana-offline-source-bundle.py BUNDLE
PASS offline bundle adversarial: 23
exit 0; stderr vacío
```

Las 23 comprobaciones comprenden las 21 previas (incluida la escritura sobre el mismo inode entre `fstat` y lectura), el rechazo de symlink en ancestro de raíz y la limpieza de descriptores tras 80 aperturas fallidas, cuando `/proc/self/fd` existe. También se ejecutó un ensayo local independiente en Python normal y `-O` con estas salidas idénticas:
```text
PASS ancestor symlink blocked
PASS concurrent inode rewrite blocked
PASS descriptor cleanup after 80 failures
```

SHA-256 local de la copia del verificador corregido: `c1341e3151f4f2ceb7456caa4bc068d197e9a59360629332b0b881cecef1339f`. Git blob SHA-1 local: `e17c0cf35fa0efd0e771e6ace69aadec5bb4f274`, **idéntico** al blob devuelto por el conector tras actualizar el verificador en GitHub.

**Límite de procedencia de la batería:** el archivo de pruebas local es una copia editada con la misma lógica de 23 casos, pero su blob Git SHA-1 `d937fe12b189cbf2663fcea61e83ebe04676a549` no coincide con el blob GitHub publicado tras los cambios (`dfa6696eaa74caeadc0b9814e7063d63f6662601`); hay diferencias de texto. Por ello, **no se afirma que se haya ejecutado byte a byte el archivo de pruebas publicado en GitHub**. Los resultados son de la copia local descrita.

## Alcance
El ensayo de escritura concurrente es determinista y se inyecta entre `fstat` y lectura; no demuestra resistencia universal a escrituras con metadatos restaurados ni modificaciones tras la lectura. No se activaron GitHub Actions, no se descargó cartografía ni se accedió a Supabase, staging o producción. Sigue vigente el estado NO-GO de ejecución operativa.
