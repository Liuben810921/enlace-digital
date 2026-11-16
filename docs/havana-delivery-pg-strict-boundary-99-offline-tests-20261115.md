# Cierre offline de validación adversarial y límite de confianza — 2026-11-15

**Base:** `96b7c1d6eccf9c64ec554565e5932a6b58ab5da3`.  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Publicación y cotejo exacto

| Archivo | Git blob local = GitHub | SHA-256 local |
|---|---|---|
| `experiments/havana-osrm-portable/test_pg_security_manifest_adversarial.py` | `92637e01c8f77553190fd5b7d948ddbdec607784` | `19e69d5048f895813009d9e6ea7c59237af0d238318319214d33d5ff953bfd22` |
| `experiments/havana-osrm-portable/test_pg_security_strict_boundary.py` | `a0919b78588c64b4b90876c6e8d00f502a0b84c0` | `68a536e55300ad181df6863cbf6c07c9f7ed357700b41a4aba995209e6a0a9db` |

Ambos archivos se recuperaron desde GitHub después de su publicación; sus blobs coinciden con `git hash-object` de los archivos locales. El archivo adversarial necesitó corregir una diferencia reproducida en la serialización de escapes Unicode **durante la publicación**, sin cambiar la intención ni el contenido original local. El blob final coincide exactamente.

## Ejecución local

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary
git hash-object test_pg_security_manifest_adversarial.py test_pg_security_strict_boundary.py
sha256sum test_pg_security_manifest_adversarial.py test_pg_security_strict_boundary.py
```

**Resultados observados:** 99/99 OK normal y 99/99 OK optimizado; 87 pruebas anteriores y 12 nuevas. Sin defectos de ejecución reproducidos.

## Revisión adversarial y controles

El validador independiente `strict_validate` comprueba una referencia Git fija para **cada** archivo (matriz y manifiesto), en vez de aceptar únicamente hashes suministrados por el propio manifiesto. Rechaza cuando falta un ancla, los bytes no coinciden, hay JSON inválido/duplicado o esquemas de raíz y caso con campos adicionales; verifica además integridad de fuente y las 28 huellas semánticas.

Las 12 pruebas nuevas incluyen baseline, ancla ausente/errónea, claves duplicadas en matriz/manifiesto, campos adicionales, rehash coordinado, UTF-8 inválido, NaN, Unicode modificado y ausencia de atribución de aprobación.

**Límite crítico:** las anclas son constantes publicadas en el mismo repositorio y no constituyen firma ni aprobación independiente. Un actor capaz de modificar tanto los archivos como el validador podría sustituir esas constantes. El sistema falla cerrado ante ancla ausente, pero no ofrece verificación de identidad humana ni autorización externa. No se ha creado ni supuesto ninguna aprobación.

**Limitación de los tests:** algunas pruebas con JSON alterado comprueban rechazo por diferencia de blob antes de llegar al parser o al esquema. El parser estricto de claves duplicadas se verifica de forma directa en la batería adversarial anterior; para probar exhaustivamente todas las rutas del nuevo validador bajo anclas deliberadamente actualizadas haría falta una batería adicional. Las pruebas siguen siendo documentales, no PostgreSQL.

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM. No se modificaron tienda ni workflows, no se descargó cartografía, no se generaron costos y no se accedió a Supabase, staging, producción ni datos reales.
