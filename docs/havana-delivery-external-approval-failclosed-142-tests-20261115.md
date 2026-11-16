# Cierre offline de aprobación externa sintética — 2026-11-15

**Base solicitada:** `1eb22beefe96eea3926b853de44f5865e341d207`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`

## Publicación y cotejo remoto

| Archivo | Git blob local = remoto | SHA-256 local |
|---|---|---|
| `experiments/havana-osrm-portable/test_pg_external_approval_contract.py` | `efa5c91e512f893eeb0f94baa354932d36dc3271` | `c16afeb585b01413647ebe10c45c542a1f9122051d25f364e54b8fdb3b377a47` |
| `experiments/havana-osrm-portable/test_pg_external_approval_failclosed.py` | `077b30a7771e8575cb237582d8129617f378202a` | `5319ab4516738ec40ab6a4cf037f26163c5852ae6be0b4a866d9cb790ca63abb` |

Se publicaron en commits `da3ceb295301e64d5ac9fcaa8ab86e409d3c6ec4` y `7f2eefda5155a758322bb31063260b9c2d4091d7`, respectivamente. Ambos se recuperaron por GitHub y se cotejaron sus Git blobs con `git hash-object` de los bytes locales. Los SHA-256 indicados se calcularon sobre esos bytes.

## Pruebas ejecutadas

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed
git hash-object test_pg_external_approval_contract.py test_pg_external_approval_failclosed.py
sha256sum test_pg_external_approval_contract.py test_pg_external_approval_failclosed.py
```

**Resultados observados:** `Ran 142 tests ... OK` en Python normal y `Ran 142 tests ... OK` en Python `-O`. La ejecución local de solo los dos módulos de aprobación también dio `31 tests ... OK` en ambos modos.

## Defecto de confianza reproducido y contención

El prototipo original `approval_gate` acepta `verified_external_record=True` y `independent_anchor_verified=True` proporcionados por el llamador, junto con referencias sintéticas de revisor y digest, para devolver `[]` (contrato sintético satisfecho). **Eso no es una prueba de aprobación externa ni una autorización real.**

El nuevo módulo independiente `authorization_decision` devuelve incondicionalmente `('DENY','EXTERNAL_TRUST_VERIFIER_NOT_CONFIGURED')` mientras no exista un verificador externo confiable. Sus 11 pruebas incluyen falsificación de booleano, revisor, digest, referencias de commit, firma ausente, contenido alterado, hashes coordinados y combinaciones sintéticas. El retorno de `approval_gate` se utiliza únicamente como *fixture* de prueba; no debe integrarse en ningún flujo de autorización real.

## Bloqueantes para una aprobación real

1. Definir un canal externo protegido y verificable, independiente de la rama candidata y de su autor.
2. Definir identidad y permisos de revisores, firmas o atestaciones verificables y política de revocación.
3. Vincular de forma criptográficamente comprobable commit, blobs, SHA-256, decisión y evidencia de aprobación.
4. Diseñar y probar un verificador que no acepte banderas arbitrarias del llamador; mantener `DENY` hasta autorización independiente.
5. Autorizar por separado cualquier conexión, despliegue o prueba operativa.

**No existen aprobaciones reales ni firmas emitidas en esta etapa.** El retorno `DENY` es una especificación offline, no un control desplegado.

## Restricciones respetadas

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM. No se modificaron tienda, workflows, matriz ni manifiesto; no hubo cartografía, costos ni acceso a Supabase, staging, producción o datos reales.
