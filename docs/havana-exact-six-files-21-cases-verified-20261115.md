# Verificación integral offline del ZIP recibido — 2026-11-15

Base de trabajo: `501b503879c9508d91b5c84d1347b3acf6759ea4`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Procedencia y método
El usuario adjuntó el ZIP `enlace-digital-plan-havana-osrm-benchmark-offline-20261114.zip`, SHA-256 local del ZIP completo `05ffb4e63fa33b1d679cca576ee17fddac0dc6dc8755384dffcb8646df262157`. Se extrajeron **solo seis archivos de código/manifiesto** con `zipfile.ZipFile.read` a `/mnt/data/ed_verified_bundle`, sin ejecutar JavaScript, sin descargar cartografía y sin red pública. Se calculó localmente el SHA-1 Git usando `SHA1(b"blob " + ascii(size) + b"\\0" + bytes)` y SHA-256 con `hashlib`. Los seis SHA-1 coinciden con los blobs obtenidos previamente por el conector GitHub. La coincidencia de blobs valida los bytes individuales; no certifica la identidad de todos los archivos del ZIP ni el commit del ZIP completo.

| Archivo | Bytes | Git blob SHA-1 local | SHA-256 local | GitHub SHA-1 |
|---|---:|---|---|---|
| `tests/verify-havana-offline-source-bundle.py` | 5246 | `1130338c88d03ab5019a891500a61da5c9d1fd10` | `b659853228bb1a88f4dde72675eafd5b48b92298158038433be11dc6b3c79822` | MATCH |
| `tests/test-havana-offline-source-bundle.py` | 7159 | `29ca5bf035b03801f0ab503d0ba348d803fdce60` | `0f1c8b445997d405a73ec7e3964f19212690fb60e1d596dd44cba4a7145595a1` | MATCH |
| `tests/fixtures/havana-offline-source-bundle-lock.json` | 908 | `cdc2835ccbbc8f83256418580de751ea882a88e3` | `a3b95af3c442e60ee192a85fbe823e1ffb26f133dc6118d28ebe1954e2b6f064` | MATCH |
| `tests/havana-offline-cartography-manifest-isolated.cjs` | 5086 | `c8503cb7a67c5d4517ef21ba34881a412fbddc6c` | `f53625ccd634311c4858303dfe03280702b694dc8f110f5766a5598969599c40` | MATCH |
| `tests/havana-offline-cartography-manifest-isolated.test.cjs` | 2633 | `af3bbcb60ff67237ed3691b45a30046cd52322e1` | `27bea12aa0b192c99c86f647fd4fc7a70f04dc7d407ea9e4f2995ccd7cf97cfc` | MATCH |
| `tests/fixtures/havana-offline-cartography-manifest.json` | 1000 | `cf9f67c507d2619ee5979a39db0caef3e6ae7145` | `092dfeac27878b4dc01d49222e21b352400c0327bce98745dd05139326546435` | MATCH |

## Ejecuciones reales
Se ejecutaron mediante `subprocess.run` con `sys.executable`, `capture_output=True`, `text=True`, `timeout=30` los siguientes comandos, pasando como argumento el directorio `/mnt/data/ed_verified_bundle`:

| Comando | stdout exacto (sin salto final) | stderr | Exit |
|---|---|---|---:|
| `python tests/verify-havana-offline-source-bundle.py BUNDLE` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| `python -O tests/verify-havana-offline-source-bundle.py BUNDLE` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| `python tests/test-havana-offline-source-bundle.py BUNDLE` | `PASS offline bundle adversarial: 21` | vacío | 0 |
| `python -O tests/test-havana-offline-source-bundle.py BUNDLE` | `PASS offline bundle adversarial: 21` | vacío | 0 |

La batería de 21 ataques incluye la inyección de escritura en el mismo inode mediante `os.dup`, después del primer `fstat` y antes de la lectura, con `fsync` y rechazo esperado. Las 21 pruebas pasaron en ambos modos; no se atribuyen otras carreras no ejecutadas.

## Restricciones y alcance
- Solo ejecución offline de scripts Python de verificación y pruebas; no se ejecutó el código cartográfico JavaScript.
- No se modificó el verificador ni el manifiesto bloqueado; se conservan `networkAllowed=false`, `executionAllowed=false` y `status=blocked_offline_review_only`.
- No se activaron GitHub Actions, no se descargó cartografía, no se accedió a Supabase, staging ni producción.
- El PASS valida **este conjunto de 21 casos**, no ausencia universal de carreras, ni despliegue, ni seguridad completa de producción.
