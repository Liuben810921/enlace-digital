# Auditoría adversarial offline de atestación v1 — 2026-11-16

**Base:** `4f18123698c7a18288e24596643e5ef7e5d6d1ef`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`

## Defectos reproducidos

El validador publicado `test_pg_attestation_v1_published.py` lanza `TypeError` si la fuente `revoked` es `None`, `True` o `42`. Se reprodujo con la atestación sintética válida y reloj fijo. Una fuente de revocación con formato `dict` puede pasar la prueba de pertenencia y terminar en `DENY_NO_EXTERNAL_TRUST` sin comprobar su procedencia; **no equivale a una fuente confiable**.

La validación original no define una política de identificadores ASCII; acepta identificadores Unicode visualmente confundibles cuando no coinciden con el autor. Se revisaron además límites temporales, tipos inesperados y fechas extremas. El estado `DENY_NO_EXTERNAL_TRUST` permanece inalterado.

## Corrección offline aislada

Se creó el archivo **local** `/mnt/data/ed_acceptance/test_pg_attestation_v1_hardened.py`, una envoltura independiente `hardened_check` que:

- Rechaza tipos de entrada no esperados y relojes sin zona o no UTC.
- Requiere una instantánea de revocación de tipo `frozenset` con identificadores ASCII; **esto solo comprueba estructura, no procedencia externa real**.
- Rechaza duplicados JSON, constantes no finitas y caracteres Unicode confundibles en identificadores.
- Exige fechas en formato `YYYY-MM-DDTHH:MM:SSZ`, controlando fechas inválidas y años fuera de rango.
- Conserva `DENY_NO_EXTERNAL_TRUST`; no confía en `external_verifier` suministrado por el llamador.

**Identidad del archivo local:**
Git blob `2cb2cff565038995e9509d0a336f9e9644f1c9c0`. SHA-256 `6ba225302c37445cb450720b531b13623754a7f640c9e1d3331996537e925987`.

**Limitación explícita:** esta envoltura todavía **no se ha publicado como código en GitHub**. Por ello, no se afirma cotejo remoto del blob o SHA-256. Se publica este informe con evidencia reproducible, no se atribuye al código local una revisión remota inexistente.

## Ejecución local

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_attestation_v1_hardened
python -O -m unittest -q test_pg_attestation_v1_hardened
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened
git hash-object test_pg_attestation_v1_hardened.py
sha256sum test_pg_attestation_v1_hardened.py
```

**Resultados observados:** 18/18 OK en normal y `-O` para el módulo nuevo; **192/192 OK** en normal y `-O` para la batería integral de 11 módulos.

## Riesgos y bloqueantes

- `frozenset` no acredita origen ni frescura de la lista de revocaciones. Una fuente ausente o no autenticada debe seguir bloqueando cualquier autorización real.
- Un reloj UTC local puede ser manipulado. No existe fuente temporal confiable configurada.
- El prototipo aún no verifica firmas criptográficas ni identidad real de revisores.
- La envoltura es un prototipo de prueba, **no está conectada al control de autorización operativo**. El código original conserva los defectos descritos; la mitigación está aislada en el archivo local.
- Publicar y cotejar el archivo corregido en GitHub sigue pendiente; después se debe ejecutar exactamente el contenido publicado y repetir las pruebas.

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM, ni se modificaron tienda, workflows, Supabase, staging, producción o datos reales. No se descargó cartografía ni se generaron costos.
