# Cierre de integridad de matriz adversarial PostgreSQL — offline

Base: `1f58094a55be4a6c27cb29e26628c69af70a78ee`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Publicación exacta comprobada

Se publicaron en GitHub los **bytes originales sin modificaciones** de los dos archivos preparados localmente en `/mnt/data/ed_acceptance`. Después de publicar ambos, se recuperaron desde GitHub en el commit `475b1718eb437a1b46d8be58e61a19f1cff4a227` y se compararon los Git blobs con `git hash-object` local:

| Archivo | Blob local = GitHub | SHA-256 local |
|---|---|---|
| `experiments/havana-osrm-portable/pg_security_acceptance_matrix.json` | `1d62376dfd549bb732c31f5cff6f46eb4e89420b` | `ab981d9a50d3d43ccd568120c3d4ca18a4985ab0d12c369045d6097788d18586` |
| `experiments/havana-osrm-portable/test_pg_security_acceptance_static.py` | `212e1ac4bccaf0761657bb8c390ec54372af98d9` | `9a4dee57cefe24df16c1b480ad18dcab94d0f14306eb953f79346c7a4ec2134b` |

Longitudes de contenido UTF-8 recuperado: 5491 y 3515 bytes, respectivamente. Se confirmó coincidencia de blobs exactos; los SHA-256 corresponden a los bytes locales ahora identificados inequívocamente por esos blobs.

## Pruebas efectivamente ejecutadas

```sh
cd /mnt/data/ed_acceptance
git hash-object pg_security_acceptance_matrix.json test_pg_security_acceptance_static.py
sha256sum pg_security_acceptance_matrix.json test_pg_security_acceptance_static.py
python -m unittest -q test_pg_security_acceptance_static
python -O -m unittest -q test_pg_security_acceptance_static
```

Resultados observados: **Ran 18 tests ... OK** normal y **Ran 18 tests ... OK** con Python `-O`. No hubo fallos reproducidos; no se modificaron los archivos originales.

## Auditoría adicional de alcance y vacíos

La matriz especifica 28 casos: identidad RLS 5, roles 5, CAS 7, idempotencia 6, RPC 5. Sus oráculos son **resultados requeridos**, no resultados observados en PostgreSQL. Los tests actuales verifican principalmente estructura, cardinalidad, prefijos y presencia de algunos escenarios. No prueban exhaustivamente el mapeo individual caso-oráculo, la resistencia a cambios semánticos ni la implementación SQL.

Riesgos que permanecen abiertos para un futuro banco efímero autorizado:

1. **Identidad RLS:** el parámetro `ed.tenant_id` no autentica. Falta vinculación confiable del inquilino y aislamiento de conexiones reutilizadas; probar tokens vencidos/audiencia incorrecta y ataques de suplantación.
2. **Roles:** verificar por catálogo los atributos `NOBYPASSRLS`, propietarios, `PUBLIC`, permisos de creación en `search_path` y dependencias de bootstrap.
3. **CAS:** cuatro dimensiones versionadas, bloqueo transaccional compartido por todos los escritores, detección de versiones obsoletas, desbordamiento y confirmación de un solo escritor.
4. **Idempotencia:** resultado único para reintentos idénticos, conflicto para payload diferente, semántica de rechazo sin cotización, política de expiración, conciliación de commit desconocido y rollback/reintento acotado ante `40001`/`40P01`.
5. **RPC:** propietario técnico sin bypass, `search_path` fijo, ACL de EXECUTE, objetos calificados, sin SQL dinámico inseguro y fallo cerrado de flags comerciales.

**Siguiente paso offline sugerido:** añadir un verificador de mapeo exacto de los 28 ID a oráculos y pruebas de mutación de contrato (sin tocar código operativo), manteniendo separación entre validación documental y prueba real.

## Restricciones respetadas

No se ejecutó PostgreSQL, GitHub Actions ni OSRM. No hubo descargas cartográficas, generación de costos, cambios a tienda o workflows, ni accesos a Supabase, staging, producción, clientes, pedidos o inventario.
