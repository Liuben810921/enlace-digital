# Integración y ejecución exacta de 25 pruebas TOCTOU — 2026-11-15

Base autorizada: `f20bfe003f926af9649db1ecddb44fbae44f0d9a`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Cambios
Commit de código: `3fd3a38ac9648f7b4a28b1993a227a1e61bbf6e0`. Se añadieron a `tests/test-havana-offline-source-bundle.py` dos escenarios deterministas:
1. Sustitución de la ruta del directorio raíz **después de abrir su descriptor**. La lectura de `LOCK` permanece anclada al inode original. El ensayo comprueba una sola lectura, pues posteriores aperturas de ruta tras la sustitución pueden fallar legítimamente.
2. Escritura `r+b` con `flush` y `fsync` sobre el inode del archivo mientras se invoca su `read`, interceptando `os.fdopen`. El verificador debe rechazar el contenido modificado y la prueba comprueba que se ejecutó la inyección.

Se conservan los 23 escenarios anteriores y la restauración de los archivos temporales. No se modificó el verificador.

## Identidad local exacta respecto a GitHub
Los SHA-1 se calcularon con el formato Git `SHA1(b"blob " + ascii(len(data)) + b"\\0" + data)`. Los SHA-1 coinciden con los blob SHA-1 devueltos por el conector GitHub.

| Archivo | Bytes | SHA-1 Git local y GitHub | SHA-256 local |
|---|---:|---|---|
| `tests/verify-havana-offline-source-bundle.py` | 5385 | `e17c0cf35fa0efd0e771e6ace69aadec5bb4f274` | `c1341e3151f4f2ceb7456caa4bc068d197e9a59360629332b0b881cecef1339f` |
| `tests/test-havana-offline-source-bundle.py` | 10679 | `8ecd6ed65a2fac78f669dce8da2864c66eda0c11` | `a52e94f7599e69033445f4ad1ae7b8db16aeb66a9e8ac4debb543da11546fc28` |

## Ejecuciones offline
Se ejecutaron en el contenedor con `subprocess.run`, `capture_output=True`, `text=True`, `timeout=40`, utilizando `/mnt/data/ed_verified_bundle` como directorio del paquete.

| Ejecución | stdout exacto (sin salto final) | stderr | Código |
|---|---|---|---:|
| Verificador Python | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| Verificador Python `-O` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| Batería Python | `PASS offline bundle adversarial: 25` | vacío | 0 |
| Batería Python `-O` | `PASS offline bundle adversarial: 25` | vacío | 0 |

La evidencia estructurada local de estas cuatro ejecuciones se guardó en `/mnt/data/ed_verified_bundle/results-25.json`. No se ejecutó código JavaScript cartográfico. El resultado cubre las 25 pruebas definidas, no todas las intercalaciones posibles de carreras.

## Restricciones
No se activaron GitHub Actions, no se descargó cartografía y no se accedió a Supabase, staging ni producción. El estado operativo sigue `blocked_offline_review_only`, con `networkAllowed=false` y `executionAllowed=false`. No hay autorización de despliegue.
