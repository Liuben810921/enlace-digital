# Atestación externa v1 — diseño sintético y pruebas offline

**Base:** `2cfb4c8e2907eac5272eae3a684a7767e58ebbe6`. **Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`.

## Contrato propuesto

Una atestación v1 contiene: versión, commit candidato, Git blobs y SHA-256 de matriz y manifiesto, instante de emisión y caducidad en UTC, identificador del autor, dos revisores con identidades distintas y funciones separadas (`security` y `business`), decisiones explícitas, identificador de revocación, esquema de firma y firmas.

Se emplean **exclusivamente** identidades `SYNTHETIC-*` y cadenas `SYNTHETIC:*`, que no son firmas criptográficas. El parser rechaza claves duplicadas y constantes JSON no estándar. La validación exige hashes coincidentes, ventana temporal válida, ausencia de revocación y separación autor/revisores. **Aunque todo coincida, el resultado es `DENY_NO_EXTERNAL_TRUST`**, porque no existe verificador externo autorizado. El argumento `external_verifier` no se utiliza para conceder permisos.

## Evidencia de ejecución local

Se creó `/mnt/data/ed_acceptance/test_pg_attestation_v1.py` (prototipo completo local de 24 pruebas). Se ejecutaron:

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_attestation_v1
python -O -m unittest -q test_pg_attestation_v1
git hash-object test_pg_attestation_v1.py
sha256sum test_pg_attestation_v1.py
```

**Resultados observados:** 24/24 OK normal y 24/24 OK `-O`.

- Git blob del prototipo local: `03198550703418c6e9a69fb3d8bbb8de34d5ab4b`.
- SHA-256 del prototipo local: `2b8de082aadad143537b2d7dc3313ff5c8b30477963d748b61d262daddbf9da6`.

## Artefacto publicado

Se publicó una versión reducida, independiente, de **12 pruebas** en `experiments/havana-osrm-portable/test_pg_attestation_v1_published.py`, commit `824930d6b4c9aa571f19a2967034794218cd8f5c`. Se recuperó de GitHub y se verificó que el blob remoto es `b7ba32ded26b6a3084c53247f53046679c1b4324`, con 12 métodos de prueba.

**Distinción de alcance:** la ejecución 24/24 corresponde al prototipo completo local, no a la versión reducida publicada. No se ha realizado todavía la ejecución local byte por byte de la versión publicada ni su cotejo SHA-256 local/remoto; esos puntos quedan pendientes y no deben darse por cerrados.

## Bloqueantes de confianza

- Elegir y proteger un canal externo independiente de la rama y del autor.
- Establecer directorio de identidades, permisos y separación de funciones verificables.
- Seleccionar firma criptográfica real, distribución de claves y política de rotación.
- Definir fuente de tiempo confiable, lista de revocación íntegra y comportamiento ante indisponibilidad: **rechazar**.
- Atar las firmas a una serialización canónica versionada, commit y hashes exactos, sin permitir sustitución de anclas por el candidato.
- Requerir autorización independiente antes de cualquier integración operativa.

No se generaron firmas ni aprobaciones reales. Ninguna prueba sintética constituye autorización.

## Restricciones

Solo documentación, Python offline y publicación de artefactos en GitHub. Sin PostgreSQL, Actions, OSRM, cartografía, costos, tienda, workflows, Supabase, staging, producción ni datos reales.
