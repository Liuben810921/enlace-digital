# Auditoría offline de independencia de diagnósticos — 259 pruebas

**Base autorizada:** `a6b1a3f89df4705c5ba5641b21d833898be88fd3`.  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`.  
**Commits:** corrección `ee531a296d86344ead5e1273de78280857c09968`; nuevas pruebas `b73755472d383f9b1d07af576075b10a40ed3405`.

## Hallazgos reproducidos

Se confirmó que excepciones ordinarias de funciones importadas como `git_blob`, `hashlib.sha256` y `json.loads` podían escapar de `hardened_check`. La alteración de `published.KEYS` o `published.REVIEW` también podía generar códigos `SCHEMA` y `REVIEWER_SCHEMA` espurios, sin señalar la dependencia alterada.

## Corrección

La función pública offline ahora comprueba que los conjuntos de claves y campos importados coincidan con definiciones locales inmutables; si no coinciden, devuelve `DENY_NO_EXTERNAL_TRUST`. Una envoltura exterior captura excepciones derivadas de `Exception` y devuelve el mismo rechazo. No captura `BaseException`, por lo que `KeyboardInterrupt` y `SystemExit` se propagan deliberadamente. Los rechazos específicos previamente comprobados de manera independiente siguen preservándose ante una dependencia `check` que devuelve `ALLOW`.

**Límite:** la comprobación de conjuntos importados no garantiza independencia absoluta frente a manipulación del intérprete, módulos compartidos, `hashlib`, `datetime`, ni del propio código. La capa es un prototipo de pruebas, no una autoridad externa.

## Evidencias de bytes publicados

Se recuperaron ambos archivos de GitHub en `b73755472d383f9b1d07af576075b10a40ed3405`. Los Git blobs remotos coinciden con `git hash-object` de los archivos locales ejecutados:

| Archivo | Bytes | Git blob remoto y local | SHA-256 local |
|---|---:|---|---|
| `test_pg_attestation_v1_hardened.py` | 8530 | `1e03ac7966eb1aee0ecab0b42f61c7153f822d15` | `76b1483006ecd7807a11267e96b8cd1067de0dfa5f499e2855b1393102f567d9` |
| `test_pg_attestation_import_boundary.py` | 2810 | `621f7a13fd9188ac56ebe4f7656d7c7a065f81af` | `c1afdbe6c12deafafac55fb38e939a0cb68bcde07fe1f097d95be3ea4fd61c8b` |

El SHA-256 fue calculado localmente sobre los bytes cuyos blobs coinciden con GitHub. No se ejecutó GitHub Actions.

## Ejecución reproducible

```sh
cd /mnt/data/ed_acceptance
mods='test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary test_pg_attestation_quality_oracles test_pg_attestation_mutation_diagnostics test_pg_attestation_dependency_mutations test_pg_attestation_import_boundary'
python -m unittest -q $mods
python -O -m unittest -q $mods
git hash-object test_pg_attestation_v1_hardened.py test_pg_attestation_import_boundary.py
sha256sum test_pg_attestation_v1_hardened.py test_pg_attestation_import_boundary.py
```

**259/259 OK** con Python normal y **259/259 OK** con `python -O`, incluidos los diez casos nuevos. Se observaron dos fallos iniciales en las nuevas pruebas de mutación de esquemas importados, corregidos antes de la ejecución final. No se incluyen en el total otras baterías locales fuera de los 16 módulos enumerados.

## Pendientes

No hay raíces de confianza independientes, firmas reales verificables, tiempo autenticado, revocación autenticada ni identidad de revisores externamente atestada. El comportamiento de autorización continúa en **DENY**. No se realizaron operaciones sobre PostgreSQL, GitHub Actions, OSRM, tienda, workflows, cartografía, Supabase, staging, producción, datos reales ni recursos con costo.
