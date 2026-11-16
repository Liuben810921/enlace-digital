# Cierre verificado de las 20 pruebas adversariales de atestación v1

**Base:** `b29d81c64d71a39ba6bd1026dc1904e7076890ce`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Publicación del archivo:** `c4fd9cc78425c1efd6f64445fe31cac36d4bdb88`

## Identidad exacta del archivo

Ruta: `experiments/havana-osrm-portable/test_pg_attestation_v1_negative.py`.

- Tamaño local y contenido remoto recuperado: **4179 bytes**.
- Git blob local (`git hash-object`) = Git blob remoto obtenido mediante GitHub: `b37c76fe05c0c152796a81fb098344d4debd0392`.
- SHA-256 local: `13df425f4d4a514e80e5cfcea798362739fefc9c7231441cd3dd09ff7958e677`.
- Se cotejó el contenido publicado y los 20 métodos `test_*`; el SHA-256 es el de los bytes locales cuya identidad Git blob coincide con el remoto. No se afirma un cálculo independiente de SHA-256 por un servicio remoto.

## Ejecución offline repetida

Desde `/mnt/data/ed_acceptance`:

```sh
python -m unittest -q test_pg_attestation_v1_negative
python -O -m unittest -q test_pg_attestation_v1_negative
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative
git hash-object test_pg_attestation_v1_negative.py
sha256sum test_pg_attestation_v1_negative.py
```

**Resultados observados:**

| Batería | Python normal | Python `-O` |
|---|---|---|
| 20 pruebas negativas nuevas | 20/20 OK | 20/20 OK |
| 10 módulos integrales | **174/174 OK** | **174/174 OK** |

No hubo defectos reproducidos en esta ejecución que justificaran modificar los validadores originales.

## Alcance de las pruebas negativas

Incluyen límites de emisión y caducidad, fechas malformadas, reloj sin zona horaria, revocación, duplicación de revisores, autor como revisor, decisión rechazada, campos adicionales, sustitución del manifiesto, reanclaje coordinado, intento de inyectar verificador externo, esquema de firma no sintético, JSON duplicado y versión no admitida.

La atestación sintética coherente termina en `DENY_NO_EXTERNAL_TRUST`. La coincidencia de hashes o el indicador sintético no constituye una aprobación externa.

## Bloqueantes restantes

Faltan un canal de confianza independiente, identidades y permisos verificables de revisores, firmas criptográficas reales y custodia de claves, revocación y tiempo confiables, y autorización separada para cualquier integración. **No hay aprobación real ni control desplegado.**

## Restricciones

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no se modificaron tienda, workflows, matriz o manifiesto; no se descargó cartografía, generaron costos ni consultaron Supabase, staging, producción o datos reales.
