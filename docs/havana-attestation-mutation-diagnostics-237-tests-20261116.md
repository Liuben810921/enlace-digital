# Auditoría offline de mutaciones y diagnósticos de rechazo — 237 pruebas

**Base:** `a7db00cfd754804c3106f4339ab5960a5609f3e9`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commits:** validador `78151303c59d2f624439b8020a2ebab02d9fc513`, oráculos existentes `2688899ce3116935a69668ae5c2723af923cff4a`, cinco pruebas nuevas `06c1e56abcff0adbc508d204f646653fda07e36f`.

## Hallazgo reproducido

La envoltura `hardened_check` podía ocultar errores específicos detrás de `DENY_NO_EXTERNAL_TRUST` si el validador delegado `check` era sustituido por una función que devolvía siempre ese rechazo genérico. El comportamiento era fail-closed respecto a autorización, pero **perdía precisión diagnóstica**, por lo que los oráculos de mutación anteriores no protegían la detección de `CONTENT_MISMATCH`.

## Corrección limitada a prototipos offline

Se añadieron verificaciones locales e independientes del delegado para:

- Integridad de `matrix_blob`, `manifest_blob` y SHA-256: `CONTENT_MISMATCH`.
- Formato y vigencia de fechas UTC: `TIME` o `EXPIRED`.
- Pertenencia del identificador a la instantánea de revocación: `REVOKED`.
- Separación de autor/revisores, roles y decisiones: `SEPARATION`.
- Esquema y formato de firmas **sintéticas**, sin validación criptográfica: `SIGNATURE_FIXTURE`.

La prueba 20 del módulo `test_pg_attestation_quality_oracles.py` se actualizó para **exigir** `CONTENT_MISMATCH` ante la mutación. El módulo nuevo `test_pg_attestation_mutation_diagnostics.py` incorpora cinco pruebas que sustituyen `check` por un retorno genérico `DENY_NO_EXTERNAL_TRUST` y comprueban los cinco diagnósticos específicos. El `ALLOW` inesperado sigue transformándose en rechazo.

## Identidad exacta de los archivos publicados

Los tres archivos se recuperaron mediante la API de GitHub en el commit `06c1e56abcff0adbc508d204f646653fda07e36f`. Los Git blobs declarados por GitHub coinciden con `git hash-object` sobre los bytes locales probados.

| Archivo | Bytes | Git blob GitHub/local | SHA-256 local |
|---|---:|---|---|
| `test_pg_attestation_v1_hardened.py` | 7704 | `59846dd3411bb389a017f7070bb58726abd4641d` | `9ffd9465161276b688eb8e1b3d8bb875e7ab5f1e8d0be79ac639f96c8369ce4a` |
| `test_pg_attestation_quality_oracles.py` | 4309 | `a8130ef7369d3bdf5b82156f1844f2e1c076f861` | `19c32ed7e9b009fe9253a7d2f2f2e0f24646ab701fdd7a46ce9390a324266786` |
| `test_pg_attestation_mutation_diagnostics.py` | 1873 | `02afcfd0f226cbbde6626e6cb265a5b6fdef40e6` | `0c9f3a65644bb5ee3ebc691eb14906c5738ef4e753b35b5c000f5ec0bbf627b7` |

Los SHA-256 son hashes calculados localmente sobre el contenido que coincide con el blob de GitHub; no se ejecutó código en GitHub Actions.

## Resultados de ejecución

Se ejecutaron 14 módulos: los 13 de la batería anterior y el nuevo módulo de cinco pruebas, desde `/mnt/data/ed_acceptance`.

- `python -m unittest -q` con la lista explícita de los 14 módulos: **237/237 OK**.
- `python -O -m unittest -q` con la misma lista: **237/237 OK**.

## Riesgos y alcance

La independencia de estas comprobaciones es **dentro del mismo prototipo Python**, no una verificación externa de confianza. El formato `SYNTHETIC-NOT-CRYPTO` no prueba firmas reales; un conjunto `frozenset` no acredita origen de revocación y el reloj local no acredita tiempo confiable. El control de confianza externo permanece en **DENY**.

No se ejecutaron PostgreSQL, GitHub Actions, OSRM ni se modificaron tienda, workflows, Supabase, staging, producción o datos reales. No se descargó cartografía ni se generaron costos.
