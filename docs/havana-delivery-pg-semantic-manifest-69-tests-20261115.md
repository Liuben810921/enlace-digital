# Cierre de integridad semántica PostgreSQL — 28 escenarios, 69 pruebas offline

**Base:** `53f95fd6946b3afc067220f0bdc7aa67f2e37547`.  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Nuevos artefactos publicados y cotejados

| Archivo | Git blob GitHub = git hash-object local | SHA-256 local |
|---|---|---|
| `experiments/havana-osrm-portable/pg_security_semantic_manifest.json` | `97147fcfa58aac2cb612c2587db4ff39778c9eb0` | `c306fb9ead574b76e2184fb43fbab6d797fb1a8ed7259a27a685324ec3be2ef2` |
| `experiments/havana-osrm-portable/test_pg_security_semantic_manifest.py` | `949345c5590e6cff4a4647373454b20f38381a1e` | `5bdd603f95e2dccc0ad77434d1303b914b8d17bae9d73f2a8705f7fc2de3ddf9` |

Se recuperaron ambos archivos mediante GitHub tras publicar, comprobando los blobs contra los calculados localmente. Longitudes exactas: 2605 y 4458 bytes. Se conserva sin cambios `pg_security_acceptance_matrix.json` con blob `1d62376dfd549bb732c31f5cff6f46eb4e89420b` y SHA-256 `ab981d9a50d3d43ccd568120c3d4ca18a4985ab0d12c369045d6097788d18586`.

## Método

El manifiesto versión 1 contiene 28 entradas SHA-256 indexadas por ID. Para cada caso, calcula SHA-256 sobre UTF-8 de una lista JSON de cinco valores, ordenados: `area`, `attack`, `oracle`, `evidence`, `blocker`, con `ensure_ascii=False` y separadores compactos. El manifiesto registra además el SHA-256 y Git blob de la matriz original.

El validador comprueba integridad original y 11 alteraciones controladas en memoria, incluyendo cambios de ataque, evidencia, bloqueante, oráculo, área, intercambio de ataques, hashes falsificados, entradas añadidas o ausentes, duplicados y versión de manifiesto inválida. Las 15 pruebas nuevas se suman a 18 originales y 36 del endurecimiento anterior.

## Pruebas realmente ejecutadas localmente

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest
git hash-object pg_security_semantic_manifest.json test_pg_security_semantic_manifest.py
sha256sum pg_security_semantic_manifest.json test_pg_security_semantic_manifest.py
```

**Resultado observado:** 69/69 OK en Python normal y 69/69 OK en Python `-O`. Sin defectos reproducidos. No hubo modificaciones de la matriz ni de los validadores anteriores.

## Riesgos y alcance

La comprobación protege la **integridad textual del contrato** respecto de los hashes registrados; no demuestra que los textos sean semánticamente correctos ni que PostgreSQL cumpla los oráculos. Un cambio intencional de matriz y manifiesto podría volver a generar hashes válidos; su aprobación debe estar sujeta a revisión independiente. Tampoco se ha ejecutado SQL ni validado seguridad transaccional de RLS, roles, CAS, idempotencia o RPC.

**Restricciones respetadas:** sin PostgreSQL, Actions, OSRM, cartografía, costos, cambios operativos, workflows, Supabase, staging, producción ni datos reales.
