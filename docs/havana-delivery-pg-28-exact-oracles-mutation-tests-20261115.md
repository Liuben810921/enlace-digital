# Endurecimiento offline de matriz PostgreSQL: 28 pares exactos y mutaciones

**Base:** `7c75581982f57fdae6ab682b559c7aaa5346b860`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`

## Cambios

Se agregó exclusivamente `experiments/havana-osrm-portable/test_pg_security_acceptance_hardened.py`. No se alteraron la matriz JSON original, el validador de 18 pruebas ni el SQL. El validador nuevo exige mapeo exacto `ID -> (área, oráculo)` para los 28 casos y detecta mutaciones en copias en memoria: oráculo, área, duplicado, eliminación, aprobación comercial, evidencia vacía e ID desconocido. Una prueba adicional valida el contrato completo sin mutaciones.

**Nota:** los casos prueban la integridad del contrato documental, no la implementación PostgreSQL ni la eficacia de RLS.

## Evidencia exacta

| Archivo | Git blob local = GitHub | SHA-256 local |
|---|---|---|
| `pg_security_acceptance_matrix.json` (sin cambios) | `1d62376dfd549bb732c31f5cff6f46eb4e89420b` | `ab981d9a50d3d43ccd568120c3d4ca18a4985ab0d12c369045d6097788d18586` |
| `test_pg_security_acceptance_static.py` (sin cambios) | `212e1ac4bccaf0761657bb8c390ec54372af98d9` | `9a4dee57cefe24df16c1b480ad18dcab94d0f14306eb953f79346c7a4ec2134b` |
| `test_pg_security_acceptance_hardened.py` (nuevo) | `a4bebb67218c516b083a45f8b0031841ee53a0f3` | `6aedfa28e72aab21d2c2c8a3a15934265725a94a002b317abf075c3928bae501` |

El nuevo archivo se recuperó desde GitHub después de publicar y se verificó que su blob coincide con `git hash-object` local. Los hashes SHA-256 se calcularon sobre los archivos locales.

## Ejecución local observada

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened
python -O -m unittest -q test_pg_security_acceptance_static test_pg_security_acceptance_hardened
git hash-object test_pg_security_acceptance_hardened.py
sha256sum test_pg_security_acceptance_hardened.py
```

**Resultado:** 54/54 OK en Python normal y 54/54 OK en Python `-O`. Desglose: 18 tests previos + 28 pares exactos + 8 tests generales/mutación. Las siete mutaciones intencionales se detectaron, sin fallos reproducidos.

## Cobertura y riesgos residuales

- **RLS:** cinco pares exactos, incluyendo GUC falsificada, identidad ausente, aislamiento cruzado, pool reutilizado y token inválido.
- **Roles:** cinco pares, incluyendo bypass, ACL, propiedad, bootstrap y CREATE en `search_path`.
- **CAS:** siete pares, con cuatro versiones obsoletas, doble escritor, overflow y ruta de escritura sin bloqueo.
- **Idempotencia:** seis pares, con repetición, conflicto, commit desconocido, rechazo sin quote, expiración y SQLSTATE.
- **RPC:** cinco pares, con `search_path`, EXECUTE, tenant arbitrario, SQL dinámico y fail-open.

**Limitación relevante:** los tests nuevos comprueban la exactitud de los oráculos y los dominios, pero no fijan de forma criptográfica los textos de ataque/evidencia/bloqueante; esos textos podrían variar conservando los IDs y oráculos. Una revisión futura podría añadir un manifiesto versionado de hashes semánticos, sin convertirlo en prueba de seguridad real.

No se ejecutó PostgreSQL, Actions ni OSRM, no se descargó cartografía ni se generaron costos, y no se modificaron tienda, workflows, Supabase, staging, producción o datos reales.
