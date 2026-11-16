# Cierre de verificación de atestación v1 y pruebas negativas offline

**Base:** `f1c38a89ccfd37eb02eab47587ac80e5d6f91f7e`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Archivo publicado, bytes verificados

`experiments/havana-osrm-portable/test_pg_attestation_v1_published.py` fue recuperado del commit base por el conector GitHub y reconstruido localmente sin alterar los bytes. Se comprobó:

- Tamaño: **5261 bytes**.
- Git blob GitHub y `git hash-object` local: **`b7ba32ded26b6a3084c53247f53046679c1b4324`**.
- SHA-256 local de esos bytes: **`ae11b9f08852b587d3db1978d77ebbf5c4b797e4436b643e80f3aa77dc50560e`**.
- `python -m unittest -q test_pg_attestation_v1_published`: **12/12 OK**.
- `python -O -m unittest -q test_pg_attestation_v1_published`: **12/12 OK**.

## Ampliación adversarial local

Se creó `/mnt/data/ed_acceptance/test_pg_attestation_v1_negative.py` con **20 casos** que cubren emisión exacta, expiración exacta, fecha anterior, intervalo invertido, reloj sin zona, zona no UTC, fecha inválida, revocación presente y vacía, autor/revisor coincidentes, revisor duplicado, decisión REJECTED, campos extra en revisor y documento, sustitución del manifiesto, reanclaje coordinado, inyección de verificador arbitrario, firma supuestamente real, JSON con clave duplicada anidada y versión no soportada.

Durante la primera ejecución se reprodujo un **error de la nueva prueba** por pasar dos veces `self` a `fixture()`. Se corrigió únicamente el archivo nuevo; después se eliminó una importación que duplicaba los tests publicados en el descubrimiento. Los 20 casos negativos quedaron correctos.

- Git blob local de pruebas nuevas: **`b37c76fe05c0c152796a81fb098344d4debd0392`**.
- SHA-256 local: **`13df425f4d4a514e80e5cfcea798362739fefc9c7231441cd3dd09ff7958e677`**.
- **Este archivo de 20 pruebas todavía no se publicó en GitHub**; no se afirma cotejo remoto de su blob.

## Batería integral

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative
```

**Resultados observados: 174/174 OK normal y 174/174 OK con `-O`.**

## Límites y bloqueantes

La función `check` verifica invariantes sintéticos y devuelve `DENY_NO_EXTERNAL_TRUST` incluso para documentos coherentes. El parámetro `external_verifier` es ignorado intencionalmente: ningún objeto arbitrario pasado por el llamador acredita confianza. Los hashes que se recalculan conjuntamente pueden coincidir, pero no demuestran aprobación. La revocación se prueba con un conjunto local sintético, no con una fuente externa confiable.

Para una autorización real siguen pendientes: autoridad de revisores independiente; anclas aprobadas fuera de la rama; firmas criptográficas verificables y custodia de claves; fuente temporal confiable; revocación íntegra y disponible; política de expiración; auditoría y aprobación independiente de cualquier integración.

**No se han emitido firmas, autorizaciones ni aprobaciones reales.**

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM. No hubo cambios de tienda, workflows, matriz o manifiesto, descargas cartográficas, costos ni acceso a Supabase, staging, producción o datos reales.
