# Auditoría adversarial del validador estricto — 2026-11-15

**Base autorizada:** `892f16151d1affb2c6ac8b3f48a0db08e98feb2c`. **Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`.

## Ejecución reproducible local

En `/mnt/data/ed_acceptance` se creó `test_pg_security_strict_adversarial.py` con 18 pruebas adversariales nuevas, sobre el código existente. Se ejecutaron:

```sh
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary test_pg_security_strict_adversarial
git hash-object test_pg_security_strict_adversarial.py
sha256sum test_pg_security_strict_adversarial.py
```

**Resultados observados:** 117/117 OK normal y 117/117 OK `-O`. El archivo local de 18 pruebas tiene Git blob `338a5ee91a542ba0bac9c3fcce4ae0455f9a4a70` y SHA-256 `6e02336040e16671e706cfda44f4f60bad95cc28f3d4a052e226598d6fd675c7`.

## Publicación remota

Se publicó una **versión condensada de 12 pruebas** en `experiments/havana-osrm-portable/test_pg_security_strict_adversarial_published.py`, commit `c354cf43618d1965abb7934113354ecd5a9b3650`. Su recuperación mediante GitHub confirmó el blob remoto `95f5d2e894099da3c436696ac19b99be7ebba2d0` (3242 bytes). **No se ha ejecutado esta versión condensada sobre bytes descargados del remoto; no se le atribuyen los resultados 117/117.** El cotejo SHA-256 local/remoto de este archivo condensado está pendiente. La batería completa de 18 pruebas se conserva localmente.

## Resultados adversariales y calidad de pruebas

- **Duplicados JSON:** se exige `INVALID_JSON:ValueError`, no simplemente un rechazo genérico causado por cambio de hash.
- **Campos extra:** con anclas recalculadas para aislar la causa, se exige `MATRIX_SCHEMA`, `CASE_SCHEMA`, `MANIFEST_SCHEMA` o `CASE_IDS`, según el nivel.
- **Cambios coordinados:** un ataque editado con hash de entrada y hashes de origen regenerados se rechaza bajo las anclas originales; al sustituir arbitrariamente ambas anclas, puede aceptarse. Es una limitación de confianza **reproducida**, no una aprobación.
- **Unicode:** cambios NFC y NFD en bytes se detectan por ancla. La equivalencia semántica de grafías no está definida como política de aprobación.
- **No finitos, UTF-8 inválido y anclas ausentes:** rechazos con códigos concretos.
- **Falsos positivos:** diferencias de formato JSON sin cambios semánticos se rechazan por el anclaje de bytes; es intencional para una revisión byte a byte, pero exige aprobación de nueva versión incluso para reformateos.
- **Pruebas débiles previas:** algunos tests solo comprobaban `assertTrue(errors)`, que podía aprobar un rechazo por hash aunque fallara el parser o el esquema. Las nuevas pruebas comprueban el **código de error esperado** y usan anclas recalculadas para aislar la causa.

No se corrigieron archivos anteriores: no se reprodujo un fallo de ejecución que exigiera cambiar los validadores. Se añadieron pruebas independientes.

## Procedimiento de aprobación externa propuesto (no ejecutado)

1. Un responsable autorizado identifica el commit candidato, los Git blobs y SHA-256 exactos de matriz, manifiesto y validador.
2. Un segundo revisor, independiente del autor, revisa el diff semántico de los 28 casos y confirma explícitamente los cambios autorizados y la política de Unicode/canonicalización.
3. Se conserva fuera de la rama modificable un registro inmutable o protegido con identificador de solicitud, versión, hashes exactos, fecha, decisión y evidencia verificable de identidad de ambos revisores. **No se han creado firmas ni aprobaciones reales.**
4. La verificación local recibe esas anclas aprobadas por un canal de confianza separado; si faltan, son diferentes o la aprobación no es verificable, se bloquea la promoción.
5. Toda modificación posterior, incluso de formato, requiere nuevo cotejo y nueva aprobación. Las pruebas PostgreSQL operativas requerirán autorización independiente.

**Bloqueantes:** falta elegir el repositorio de confianza externo, sus permisos y el método verificable de firma/aprobación; no debe suponerse que un hash incluido en la misma rama constituye autorización.

## Restricciones

Trabajo exclusivamente offline y GitHub documental. Sin PostgreSQL, GitHub Actions, OSRM, cartografía, costos, modificaciones de tienda/workflows, Supabase, staging, producción o datos reales.
