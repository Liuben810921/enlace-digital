# Cierre offline: validador adversarial y ancla estricta — 99 pruebas

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base solicitada: `96b7c1d6eccf9c64ec554565e5932a6b58ab5da3`.

## Artefactos y verificación

| Archivo | Git blob local y remoto coincidente | SHA-256 local |
|---|---|---|
| `experiments/havana-osrm-portable/test_pg_security_manifest_adversarial.py` | `92637e01c8f77553190fd5b7d948ddbdec607784` | `19e69d5048f895813009d9e6ea7c59237af0d238318319214d33d5ff953bfd22` |
| `experiments/havana-osrm-portable/test_pg_security_strict_boundary.py` | `a0919b78588c64b4b90876c6e8d00f502a0b84c0` | `68a536e55300ad181df6863cbf6c07c9f7ed357700b41a4aba995209e6a0a9db` |

Ambos archivos se recuperaron de GitHub y sus blobs se cotejaron con `git hash-object` de los archivos locales. Los SHA-256 indicados corresponden a esos mismos bytes locales. La publicación del adversarial requirió corregir una transcripción de escapes Unicode antes de obtener el blob idéntico. No se cambió la matriz original ni el manifiesto original.

## Ejecución real

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened test_pg_security_semantic_manifest test_pg_security_manifest_adversarial test_pg_security_strict_boundary
git hash-object test_pg_security_manifest_adversarial.py test_pg_security_strict_boundary.py
sha256sum test_pg_security_manifest_adversarial.py test_pg_security_strict_boundary.py
```

**Resultado observado:** `Ran 99 tests ... OK` tanto normal como `-O` (87 existentes + 12 nuevos). No hubo fallos de la batería.

## Contrato de seguridad documental

El validador independiente `strict_validate` rechaza sin anclas explícitas; compara los Git blobs de la matriz y manifiesto con referencias previamente fijadas, no tomadas del manifiesto candidato. Rechaza claves JSON duplicadas, constantes no estándar, UTF-8 inválido, campos adicionales de primer nivel y de casos, y cambios simultáneos de matriz y manifiesto sin nueva autorización de las anclas. Los escenarios adversariales reproducen los límites del validador anterior.

Las referencias fijas corresponden a:
- Matriz: `1d62376dfd549bb732c31f5cff6f46eb4e89420b`
- Manifiesto: `97147fcfa58aac2cb612c2587db4ff39778c9eb0`

**Advertencias:** un hash fijo en el código no prueba la identidad de quien autorizó la versión ni sustituye un registro de aprobación independiente. Los tests validan contratos y bytes, no el funcionamiento de PostgreSQL. El validador estricto no debe ser tratado como mecanismo de firma criptográfica o control de acceso.

## Restricciones

No se ejecutó PostgreSQL, GitHub Actions ni OSRM; no hubo descargas de mapas, costos, cambios a tienda/workflows ni acceso a Supabase, staging, producción o datos reales.
