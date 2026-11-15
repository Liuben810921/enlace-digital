# Ejecución exacta del paquete cartográfico offline — 2026-11-14

**Base:** `7556ccb7437138078ca970c24430f0f4b1e0feea`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Método y procedencia

Se obtuvieron por el conector GitHub los textos de los seis archivos de origen, lock y verificación. Se reconstruyeron en `/mnt/data/ed_offline` sin `git fetch`, descarga de mapas ni acceso de red del contenedor. **Antes de ejecutar**, se verificó que `git hash-object` de cada archivo local coincidía con el blob SHA-1 reportado por GitHub. El método de reconstrucción queda validado por identidad de objeto Git, no por confianza en el pegado de texto.

| Archivo | Git blob SHA-1 exacto | SHA-256 local exacto |
|---|---|---|
| `tests/havana-offline-cartography-manifest-isolated.cjs` | `c8503cb7a67c5d4517ef21ba34881a412fbddc6c` | `f53625ccd634311c4858303dfe03280702b694dc8f110f5766a5598969599c40` |
| `tests/havana-offline-cartography-manifest-isolated.test.cjs` | `af3bbcb60ff67237ed3691b45a30046cd52322e1` | `27bea12aa0b192c99c86f647fd4fc7a70f04dc7d407ea9e4f2995ccd7cf97cfc` |
| `tests/fixtures/havana-offline-cartography-manifest.json` | `cf9f67c507d2619ee5979a39db0caef3e6ae7145` | `092dfeac27878b4dc01d49222e21b352400c0327bce98745dd05139326546435` |

Se cotejó también el verificador original `1ec00228b741582674837e9c5f73a3e4a361449e`, la prueba original `605dbdc8ea0fe7aa4944a15d173bd7cea705f111` y el lockfile original `8e94e5e42e9f7ce1cc521b5f72726f41985066ba`. Tras las modificaciones, los hashes Git locales volvieron a coincidir con GitHub:
- Verificador SHA-256 pinning: `f5e4fdddf50ca98d90851666e2cdf7b9dd9801a5`.
- Lockfile SHA-256: `cdc2835ccbbc8f83256418580de751ea882a88e3`.
- Batería de 20 pruebas: `f681dff55afae7f4fa45213257a58fbdf6c82891`.

## Cambios aplicados

1. `tests/verify-havana-offline-source-bundle.py`: se incorporó un diccionario **independiente** `SHA256`, con comparación de ambos digests por archivo; los campos del lockfile deben coincidir con constantes internas.
2. `tests/fixtures/havana-offline-source-bundle-lock.json`: cada entrada incluye `sha256` calculado sobre bytes idénticos a los objetos Git.
3. `tests/test-havana-offline-source-bundle.py`: se agregaron dos casos, cambio de SHA-256 y carrera determinista que renombra/reemplaza un directorio padre por contenido alterado. Total: **20** casos adversariales.

## Ejecución offline y códigos de salida

Directorio: `/mnt/data/ed_offline`.

```sh
python tests/verify-havana-offline-source-bundle.py .
# PASS offline source bundle: 3 pinned files; no network or execution
# exit 0

python -O tests/verify-havana-offline-source-bundle.py .
# PASS offline source bundle: 3 pinned files; no network or execution
# exit 0

python tests/test-havana-offline-source-bundle.py .
# PASS offline bundle adversarial: 20
# exit 0

python -O tests/test-havana-offline-source-bundle.py .
# PASS offline bundle adversarial: 20
# exit 0
```

Los 20 ataques incluyen: habilitar red, habilitar ejecución, cambiar commit, estado, versión, omitir/duplicar archivos, alterar Git SHA-1 o SHA-256, traversal, campo extra, JSON con claves duplicadas, JSON inválido, tamaño excesivo, tres symlinks de archivos, symlink de directorio padre, carrera de symlink antes de `open` y carrera de reemplazo de directorio con contenido modificado.

## Limitaciones y decisión

**PASS para el paquete exacto y los 20 ataques definidos; NO-GO para CI.** Una sustitución de directorio padre por otro con archivos *idénticos* puede no ser detectable por el verificador basado en hashes. La protección contra carreras no constituye una instantánea atómica: antes de usar con escritores hostiles, considerar apertura anclada a descriptores `dir_fd` y árbol inmutable.

No se ejecutó código Node del paquete, OSRM, `git fetch` ni ningún workflow. Los workflows existentes no se modificaron y conservan `on: {}`, `if: ${{ false }}`, `permissions: {}` y los flags comerciales desactivados. No se accedió a Supabase, staging, producción ni se descargó cartografía. La viabilidad de aprovisionamiento de código sin red y los costos de runner siguen pendientes de autorización y prueba independientes.
