# Cierre de publicación y verificación exacta — límite de confianza v1

**Base autorizada:** `00773b4160f2987d4f2c298c878965839d293d1a`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit del módulo publicado:** `48ba6308a607b434bb0e3b6cf9bcd2fe1f91c9ff`

## Identidad del artefacto publicado

Ruta: `experiments/havana-osrm-portable/test_pg_attestation_trust_boundary.py`.

Se recuperó el contenido publicado desde GitHub en el commit indicado. El archivo es ASCII puro, contiene **4624 bytes**, termina en salto de línea y tiene 20 métodos de prueba. Los bytes locales coinciden con la representación remota recuperada, y el Git blob calculado localmente coincide con el Git blob declarado por GitHub.

| Evidencia | Resultado |
|---|---|
| Git blob remoto GitHub | `372b58c49e2bc4753b8e66066b88a75ebb8ee042` |
| Git blob local, `git hash-object` | `372b58c49e2bc4753b8e66066b88a75ebb8ee042` |
| SHA-256 local sobre bytes idénticos | `620f04b99d89d1726ec96a4f195bf668d610e760f021ba09ead672328b5e1164` |
| Tamaño | 4624 bytes |

El SHA-256 indicado se calculó localmente; no se atribuye a GitHub una ejecución remota de SHA-256.

## Pruebas ejecutadas

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_attestation_trust_boundary
python -O -m unittest -q test_pg_attestation_trust_boundary
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary
git hash-object test_pg_attestation_trust_boundary.py
sha256sum test_pg_attestation_trust_boundary.py
```

| Batería | Python normal | Python -O |
|---|---|---|
| Módulo nuevo, 20 casos | **20/20 OK** | **20/20 OK** |
| Integral, 12 módulos | **212/212 OK** | **212/212 OK** |

No se reprodujeron defectos en esta ejecución; no se modificaron validadores previos.

## Seguridad y límites

Los cinco ámbitos modelados son procedencia de anclas, identidad y roles de revisores, revocación autenticada, tiempo confiable y firmas criptográficas. Las pruebas sintéticas incluyen sustitución, replay, suplantación, indisponibilidad y valores falsificados. **La función de frontera devuelve siempre `DENY_EXTERNAL_TRUST_UNAVAILABLE`, incluso cuando todas las afirmaciones sintéticas declaran `trusted=True`.** Por diseño, las pruebas comprueban rechazo y resistencia a una concesión accidental, pero no acreditan una implementación real de verificación criptográfica ni de las dependencias externas.

Persisten bloqueantes: fuente independiente de anclas, identidad y separación de funciones verificables, claves y firmas reales, tiempo y revocación autenticados, aprobación externa separada. No existe aprobación real ni control desplegado.

## Restricciones respetadas

Solo se creó un módulo de pruebas offline y este informe en la rama aislada. No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no se modificaron tienda, workflows, inventario ni datos; no hubo descargas cartográficas, costos ni acceso a Supabase, staging o producción.
