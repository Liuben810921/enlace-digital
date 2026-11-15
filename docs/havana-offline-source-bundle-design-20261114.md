# Prototipo de paquete cartográfico sin git fetch — 2026-11-14

Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Referencia inicial `1ce20519fea72c6f4d723cc82dab0b0fbf33a793`.

## Diseño
En vez de `git fetch` en el runner, se suministran previamente tres archivos revisados. El archivo `tests/fixtures/havana-offline-source-bundle-lock.json` fija sus rutas, SHA de objetos Git y commit de referencia. El verificador `tests/verify-havana-offline-source-bundle.py` usa solo la biblioteca estándar Python y acceso local a archivos; no importa módulos de red ni ejecuta Node, Git, shell o OSRM. El verificador exige `networkAllowed=false`, `executionAllowed=false`, `status=blocked_offline_review_only`, rutas exactamente autorizadas, archivos regulares no hardlinked, tamaño limitado y hash Git blob correcto. La prueba `tests/test-havana-offline-source-bundle.py` crea un directorio temporal y somete la copia a mutaciones adversariales.

## Identidades de archivos obtenidas de GitHub
- `tests/havana-offline-cartography-manifest-isolated.cjs`: `c8503cb7a67c5d4517ef21ba34881a412fbddc6c`.
- `tests/havana-offline-cartography-manifest-isolated.test.cjs`: `af3bbcb60ff67237ed3691b45a30046cd52322e1`.
- `tests/fixtures/havana-offline-cartography-manifest.json`: `cf9f67c507d2619ee5979a39db0caef3e6ae7145`.

Los hashes son **Git blob SHA-1**, no SHA-256. Su identidad se coteja contra constantes incorporadas en el verificador, no contra valores suministrados exclusivamente por el manifiesto. Para un paquete de distribución final, añadir SHA-256 independiente por archivo y firma de procedencia, y proteger también el propio verificador y el lockfile.

## Reproducción local prevista (no ejecutada en esta etapa)
Desde una copia local ya existente del repositorio:
```sh
python3 tests/verify-havana-offline-source-bundle.py .
python3 -O tests/verify-havana-offline-source-bundle.py .
python3 tests/test-havana-offline-source-bundle.py .
python3 -O tests/test-havana-offline-source-bundle.py .
```

La batería adversarial incluye 13 casos: habilitar red, habilitar ejecución, alterar commit, estado o esquema, quitar/duplicar archivo, cambiar hash, ruta traversal, campo extra, JSON duplicado, JSON malformado y lockfile sobredimensionado. Todas las mutaciones se realizan en un directorio temporal.

**Límite de evidencia:** se ha revisado estáticamente el prototipo y su origen, pero en esta etapa no se ha ejecutado la batería en un entorno local con las copias exactas de los tres archivos. No se declaran PASS ni códigos de salida hasta realizarla. No se ha demostrado que GitHub-hosted runners reciban un paquete sin red: esto requiere un mecanismo de aprovisionamiento independiente y autorización.

## Decisión
Mantener los workflows existentes intactos y deshabilitados: `on: {}`, `if: ${{ false }}`, `permissions: {}`, flags comerciales desactivados. No incorporar todavía este prototipo a CI. Antes de considerar uso real, verificar hashes SHA-256, ejecutar pruebas normales y `-O`, probar symlinks en directorios padres y cambios concurrentes de archivos, documentar procedencia del paquete y validar aislamiento/costos por separado. No se descargó cartografía, no se ejecutaron GitHub Actions ni OSRM, no se accedió a Supabase, staging ni producción.
