# Auditoría offline de dependencias y mutaciones — 249 pruebas

**Base:** `dd61b2cebc5be1fd55f8e0eeaf1415c5bb540f61`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Defecto reproducido y corrección

La versión anterior de `hardened_check` devolvía códigos de rechazo permitidos cuando los proporcionaba una dependencia sustituible, incluso si no existía la condición de rechazo. Se reprodujeron diagnósticos falsificados `REVOKED`, `EXPIRED`, `CONTENT_MISMATCH`, `SIGNATURE_FIXTURE` y `SEPARATION`. El código se corrigió exclusivamente en el prototipo offline: después de sus comprobaciones independientes, cualquier retorno del delegado —incluido `ALLOW`, un booleano o un código de rechazo falso— acaba en `DENY_NO_EXTERNAL_TRUST`. Cualquier `Exception` ordinaria lanzada por el delegado también devuelve `DENY_NO_EXTERNAL_TRUST`.

La corrección **no** captura `BaseException` como `KeyboardInterrupt` o `SystemExit`, ni garantiza seguridad si se manipula el propio código del prototipo o sus importaciones. No se debe interpretar como un sistema real de atestación.

## Código publicado y hashes

- Validador `experiments/havana-osrm-portable/test_pg_attestation_v1_hardened.py`: commit `b6a2991cc96c9726898b82670000ea5c2be6d068`, **7786 bytes**, Git blob remoto/local `830c3c3e9b169e2aac715ee180e038bdee0fa5e4`, SHA-256 de bytes locales idénticos `3df4e1c1c5c2bdcb198ceea49ebd6c7e575299bf6d810717b58264900eeb5e75`.
- Pruebas `experiments/havana-osrm-portable/test_pg_attestation_dependency_mutations.py`: commit final `e764e7e61b9fe08d81f838c6d5df5a06997bcb44`, **2751 bytes**, Git blob remoto/local `018fefcf8deb89bf380f6bd5368ec7f034a0d93d`, SHA-256 de bytes locales idénticos `f0b92783bec38c129078b7174bee01eb1d04e02e9d90b6b94f2ad7068a212e47`.

Los blobs se recuperaron de GitHub y coincidieron con `git hash-object` local. El SHA-256 se calculó localmente sobre los mismos bytes; no se atribuye su ejecución a GitHub.

## Pruebas ejecutadas

Se ejecutaron los 15 módulos explícitos, incluidos los 14 anteriores y el nuevo módulo de 12 pruebas. Una primera ejecución detectó **12 pruebas duplicadas** debido a importar directamente una clase `unittest.TestCase` desde otro módulo. Se corrigió la importación para usar el módulo como espacio de nombres y se repitió la batería.

- Python normal: **249/249 OK**.
- Python `-O`: **249/249 OK**.
- Nuevo módulo: **12/12 OK**.
- Los casos comprueban `ALLOW`, `True`, cinco códigos falsificados, `RuntimeError`, `AssertionError` y tres rechazos legítimos específicos bajo una dependencia que devuelve `ALLOW`.

Comando reproducible:

```sh
cd /mnt/data/ed_acceptance
mods='test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial_published test_pg_external_approval_contract test_pg_external_approval_failclosed test_pg_attestation_v1_published test_pg_attestation_v1_negative test_pg_attestation_v1_hardened test_pg_attestation_trust_boundary test_pg_attestation_quality_oracles test_pg_attestation_mutation_diagnostics test_pg_attestation_dependency_mutations'
python -m unittest -q $mods
python -O -m unittest -q $mods
git hash-object test_pg_attestation_v1_hardened.py test_pg_attestation_dependency_mutations.py
sha256sum test_pg_attestation_v1_hardened.py test_pg_attestation_dependency_mutations.py
```

## Pendientes y restricciones

La dependencia de confianza externa sigue sin existir: anclas independientes, firmas criptográficas reales, revocación autenticada, reloj confiable e identidad de revisores. La función sintética permanece en denegación. La batería de `trust_boundary` continúa incluyendo pruebas de rechazo constante, que no demuestran validación de pruebas criptográficas.

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no se modificaron tienda, workflows, cartografía, Supabase, staging, producción ni datos reales, ni se generaron costos.
