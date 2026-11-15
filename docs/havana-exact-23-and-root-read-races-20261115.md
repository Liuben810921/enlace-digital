# Cierre de procedencia y ensayos TOCTOU offline — 2026-11-15

Base: `f7a8a21fd0ca219efd67d455931919c99b2ef2b3`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Diferencia exacta resuelta
Se comparó la sección final de `tests/test-havana-offline-source-bundle.py` recuperada mediante el conector GitHub con la copia local. La diferencia era **una única línea en blanco** entre `ancestor.unlink()` y `fd_directory = Path("/proc/self/fd")`. Se añadió esa línea en la copia local sin alterar lógica. El Git blob SHA-1 local pasó a `dfa6696eaa74caeadc0b9814e7063d63f6662601`, idéntico al Git blob SHA-1 reportado por el conector. SHA-256 local: `c996fdbe1dc2d5ca5ce4c57756ff7fe7cd2d54f91308478f4d7e56833b673418` (8138 bytes). El verificador mantiene Git blob SHA-1 local `e17c0cf35fa0efd0e771e6ace69aadec5bb4f274` idéntico al conector y SHA-256 `c1341e3151f4f2ceb7456caa4bc068d197e9a59360629332b0b881cecef1339f`.

## Ejecución exacta de 23 pruebas
Se ejecutaron desde `/mnt/data/ed_verified_bundle` los archivos Python con SHA-1 Git coincidente, usando `subprocess.run`, `capture_output=True`, `timeout=30`.

| Ejecución | stdout (sin salto final) | stderr | exit |
|---|---|---|---:|
| Verificador normal | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| Verificador `-O` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| Batería normal | `PASS offline bundle adversarial: 23` | vacío | 0 |
| Batería `-O` | `PASS offline bundle adversarial: 23` | vacío | 0 |

## Ensayos adicionales ejecutados (separados de los 23)
Se creó y ejecutó exclusivamente en contenedor el script temporal `extra_races.py`. Con Python normal y Python `-O` se obtuvieron en cada ejecución estas dos salidas, código 0:

```text
PASS root directory replacement anchored original inode
PASS write during read rejected changed_during_read:f
```

1. **Sustitución de raíz:** durante la apertura relativa del archivo, el ensayo renombró el directorio raíz abierto y creó otro con contenido distinto en la misma ruta; el lector conservó el descriptor del inode original y leyó `b'abc'`.
2. **Escritura durante lectura:** se interceptó `fdopen` para escribir y sincronizar `b'XYZ'` en el mismo inode inmediatamente antes de `read`; el lector rechazó con `changed_during_read:f`.

Estas dos pruebas locales adicionales **no están incorporadas a la batería GitHub**. No se observó un fallo nuevo en los escenarios ejecutados, por lo que no se modificó código operativo. Los ensayos no demuestran resistencia universal frente a todas las intercalaciones de escritura o cambios de metadatos.

## Restricciones
Sin Internet público, sin descarga de cartografía, sin ejecución de JavaScript cartográfico, sin GitHub Actions y sin acceso a Supabase, staging o producción. El manifiesto permanece `blocked_offline_review_only` y con `networkAllowed=false`, `executionAllowed=false`.
