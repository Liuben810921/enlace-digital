# Publicación y comprobación de identidad de manifiesto OSRM — 2026-11-15

Base `983fa2a45c397030ada2251d375a1c0a5c591224`. Rama `plan/havana-osrm-benchmark-offline-20261114`.

## Publicación efectuada
- `experiments/havana-osrm-portable/manifest.py` — commit `5fd10c50a5cc3c47858d00ecbb393a4f816bfbde`.
- `experiments/havana-osrm-portable/test_manifest.py` — commit `b638a37455e8f61c5e5c9cc9d33097ec010e10f7`.

## Evidencia ejecutada
Sobre archivos locales `/mnt/data/osrm_manifest/`:
```
sha256sum manifest.py test_manifest.py
git hash-object manifest.py test_manifest.py
python -m unittest -q
python -O -m unittest -q
```
Resultados: **22/22 PASS** normal; **22/22 PASS** `-O`.

| Archivo | SHA-256 local | Git blob SHA-1 local = GitHub |
|---|---|---|
| manifest.py | `af7b23740745d2acb9a74ddcbba6945560fc05ddbc04b7888be9e5d050d85ce7` | `c301dd440f4125a02451f394c98f328ef1084eca` |
| test_manifest.py | `34379d935c6aff00520e99f190e3d2ffb9eb3d12672ff40d93efa5aa28c60a42` | `a451ce99440da83f358662c2228391680eda9e0b` |

Se consultó `fetch_file` de GitHub en `b638a37455e8f61c5e5c9cc9d33097ec010e10f7` y se comprobaron ambos blob SHA-1, longitudes de texto (3605 y 2716 caracteres) y contenidos devueltos. **Identidad Git SHA-1 comprobada**; los SHA-256 anteriores se calcularon sobre los bytes locales y **no** sobre una descarga binaria independiente de los objetos remotos. No atribuir esa segunda comprobación a GitHub.

## Alcance del manifiesto
Incluye `run_id`, `phase`, `osrm_version`, hashes SHA-256 de perfil y entrada, digest de imagen, fuente HTTPS y licencia, código de salida, tiempos, memoria, disco y muestras de latencia. Calcula p50/p95/p99 nearest-rank y SHA-256 del JSON de entrada. No verifica que la fuente, digest, versión o métricas sean verdaderos: solo valida estructura y consistencia. Tampoco demuestra procedencia firmada, consumo real de RAM o ejecución OSRM. Los 22 casos son pruebas unitarias, no mediciones de La Habana.

## Alojamiento gratuito permanente
Se mantienen descartes sustentados en documentos oficiales ya investigados: GratisVPS sin garantías de continuidad, VPSFree.io con renovación y recursos insuficientes, Vyce con renovación y borrado, Oracle sin autorización contractual para el caso de empresa cubana y Google Free Tier con cuenta de facturación y capacidad reducida. Referencias: https://gratisvps.net/terms.html ; https://vpsfree.io/ ; https://vyce.cloud/ ; https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ ; https://docs.cloud.google.com/free/docs/free-cloud-features .

**No hay candidato nuevo aprobado**, ni prueba de provisión de VPS, ni confirmación contractual de elegibilidad comercial cubana. No confundir una autorización regulatoria general con aceptación por parte del proveedor.

## Restricciones
Sin descarga de cartografía, ejecución OSRM, cuentas nuevas, activación manual de GitHub Actions, costos ni acceso a Supabase, staging o producción. El estado de workflows automáticos preexistentes no fue comprobado. `commercialQuoteEnabled=false`. Mensajerías permanece pendiente de alojamiento y benchmark real.
