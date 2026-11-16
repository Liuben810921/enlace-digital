# Auditoría offline del modelo de confianza de atestación v1

**Base:** `ca3808cb8cbbb1d77749f52632b1519fcba38096`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Modelo y límites

Se analizaron cinco dependencias externas: **ancla aprobada**, **directorio de identidad/roles de revisores**, **fuente autenticada de revocación**, **tiempo confiable** y **firmas criptográficas verificables**. Todas deben tener procedencia independiente de la rama candidata y su autor, protección de integridad, política de actualización y fallo cerrado ante indisponibilidad. Una estructura JSON que declara `trusted: true` no acredita ninguna de estas propiedades.

Se creó un prototipo sintético local `/mnt/data/ed_acceptance/test_pg_attestation_trust_boundary.py` con 20 pruebas de sustitución de ancla, suplantación y colusión de roles, revocación falsificada/caducada, reloj retrocedido, replay de firma para otro commit, sustitución de firma, caída de cada una de las cinco dependencias, entrada inválida, booleanos falsificados y modificación de manifiesto. La decisión del prototipo es incondicionalmente `DENY_EXTERNAL_TRUST_UNAVAILABLE`. Se verificó además que el endurecimiento anterior continúa devolviendo `DENY_NO_EXTERNAL_TRUST` o `REVOKED`.

## Resultados observados localmente

- Nuevo módulo: **20/20 OK** en Python normal y **20/20 OK** con `-O`.
- Batería de 12 módulos: **212/212 OK** en Python normal y **212/212 OK** con `-O`.
- Git blob **local**: `372b58c49e2bc4753b8e66066b88a75ebb8ee042`.
- SHA-256 **local**: `620f04b99d89d1726ec96a4f195bf668d610e760f021ba09ead672328b5e1164`.

Comandos:

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_attestation_trust_boundary
python -O -m unittest -q test_pg_attestation_trust_boundary
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary
git hash-object test_pg_attestation_trust_boundary.py
sha256sum test_pg_attestation_trust_boundary.py
```

## Publicación y pendiente de cotejo

Este informe se publica en GitHub. **El archivo Python de 20 pruebas sigue local** y, por tanto, los valores Git blob y SHA-256 anteriores **no han sido cotejados con un archivo remoto**. La ejecución de 212 pruebas es local y no constituye un resultado de GitHub Actions. Para cerrar la etapa es necesario publicar el archivo Python, recuperar los bytes publicados, cotejar Git blob y SHA-256, y ejecutar esa versión exacta en normal y `-O`.

## Bloqueantes

No hay ancla independiente configurada, directorio de revisores verificable, claves de firma reales, revocación autenticada ni reloj confiable. Ninguna prueba sintética debe utilizarse para conceder permisos. No se creó una autorización real ni se desplegó control alguno.

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no hubo cambios de tienda, workflows, descargas cartográficas, costos ni acceso a Supabase, staging, producción o datos reales.
