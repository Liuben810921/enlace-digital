# Cierre de corrección fail-closed y 232 pruebas offline

**Base autorizada:** `2ee6a358c110a2468818a397ac1bb43dca75bea9`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commits de código:** `de7cd3d9dae6e4f39354cb857e8ecfb0c6677537` (validador), `758dcd655a8a4063be4f024fe4e198bb187bab48` (20 oráculos).

## Defecto y corrección limitada

Se reprodujo que la envoltura `hardened_check` propagaba un `ALLOW` devuelto por una dependencia sustituida. Se corrigió **solo el validador offline** para devolver `DENY_NO_EXTERNAL_TRUST` ante cualquier decisión inesperada y conservar únicamente códigos de rechazo expresamente permitidos. La prueba de mutación 19 ahora exige `DENY_NO_EXTERNAL_TRUST` al simular `check(...)=ALLOW`.

El módulo `test_pg_attestation_quality_oracles.py` se publicó con 20 pruebas. La prueba 20 conserva el carácter de **detección de cobertura insuficiente**: una dependencia manipulada puede ocultar el motivo específico `CONTENT_MISMATCH`. No equivale a una garantía de integridad independiente.

## Identidad de contenido cotejada

Los archivos se recuperaron desde GitHub en el commit `758dcd655a8a4063be4f024fe4e198bb187bab48`; los Git blobs declarados por GitHub coinciden con los calculados sobre las copias locales probadas:

| Archivo | Git blob coincidente | SHA-256 de bytes locales idénticos |
|---|---|---|
| `test_pg_attestation_v1_hardened.py` | `dc12fe2e7820774909457ac1fa44c84ffb30d9e6` | `a32dc17fae037cfb36596520bbe9576a4cd1a66db42fa82f56867a0ab9221650` |
| `test_pg_attestation_quality_oracles.py` | `b376b04b8d12d394254f4e40a0f9b25c66f28475` | `85f7b521f59d77b9fd9e6a1488480b1899cc32565945109d580983b9af340c0b` |

## Ejecución offline

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary test_pg_attestation_quality_oracles
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary test_pg_attestation_quality_oracles
git hash-object test_pg_attestation_v1_hardened.py test_pg_attestation_quality_oracles.py
sha256sum test_pg_attestation_v1_hardened.py test_pg_attestation_quality_oracles.py
```

Resultados observados: **232/232 OK** con Python normal y **232/232 OK** con `python -O`.

## Riesgos restantes

El endurecimiento no acredita firmas criptográficas, fuentes independientes de confianza, reloj autenticado, identidad de revisores ni revocación confiable. Los oráculos de `trust_boundary` siguen comprobando principalmente denegación constante, no autenticidad. La protección contra propagación de `ALLOW` se refiere exclusivamente a la envoltura sintética, no a un servicio operativo.

## Restricciones

Sin PostgreSQL, GitHub Actions, OSRM, cambios de tienda o workflows, descargas cartográficas, costos ni acceso a Supabase, staging, producción o datos reales. Sin despliegues ni autorizaciones reales.
