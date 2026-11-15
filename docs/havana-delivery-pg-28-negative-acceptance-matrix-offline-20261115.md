# Auditoría adversarial ampliada PostgreSQL — solo offline

**Base:** `d20a5bf0e8d19fedd008d4ef2ad3e344ec1c9068`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`

## Resultado local verificado

Se crearon localmente `/mnt/data/ed_acceptance/pg_security_acceptance_matrix.json` (28 casos negativos) y `/mnt/data/ed_acceptance/test_pg_security_acceptance_static.py` (18 pruebas estáticas). **Estos dos artefactos todavía no están incorporados al repositorio GitHub**: no confundir el reporte publicado con la publicación de sus fuentes.

Comandos realmente ejecutados:

```sh
cd /mnt/data/ed_acceptance
python -m unittest -q test_pg_security_acceptance_static
python -O -m unittest -q test_pg_security_acceptance_static
git hash-object *.py *.json
sha256sum *.py *.json
```

Resultados observados: **18/18 OK** normal y **18/18 OK** optimizado, sin defectos reproducidos. Integridad de los bytes locales:

| Archivo local | Git blob local | SHA-256 local |
|---|---|---|
| `pg_security_acceptance_matrix.json` | `1d62376dfd549bb732c31f5cff6f46eb4e89420b` | `ab981d9a50d3d43ccd568120c3d4ca18a4985ab0d12c369045d6097788d18586` |
| `test_pg_security_acceptance_static.py` | `212e1ac4bccaf0761657bb8c390ec54372af98d9` | `9a4dee57cefe24df16c1b480ad18dcab94d0f14306eb953f79346c7a4ec2134b` |

**Los hashes anteriores son exclusivamente locales; no se ha comprobado equivalencia con Git blobs remotos de estos dos archivos.** La próxima acción segura es publicar sus bytes exactos y cotejarlos con GitHub antes de afirmar cierre integral.

## Matriz de aceptación — 28 casos negativos

| Área | Cantidad | Ataques y condiciones de rechazo |
|---|---:|---|
| Identidad RLS | 5 | GUC falsificada, identidad ausente/malformada, acceso cruzado, contexto residual en pool, token vencido o audiencia incorrecta |
| Roles | 5 | BYPASSRLS/superusuario, DML público, propiedad por app, dependencias ausentes, CREATE en ruta de búsqueda |
| CAS | 7 | Cesta, dirección, rutas y almacenes obsoletos; doble escritor; desbordamiento; escritor que evita el bloqueo compartido |
| Idempotencia | 6 | Misma clave y payload, payload distinto, commit desconocido, rechazo sin cotización, caducidad, SQLSTATE 40001/40P01 |
| RPC | 5 | search_path mutable, EXECUTE público, tenant suministrado por cliente, SQL dinámico, respuesta comercial abierta ante error |

Oráculos: `DENY`, `BLOCK_DEPLOYMENT`, `REJECT_STALE`, `ONE_COMMIT`, `REJECT_OVERFLOW`, `SINGLE_RESULT`, `REJECT_CONFLICT`, `RECONCILE` y `ROLLBACK_RETRY`.

## Vacíos de especificación encontrados

1. **Identidad:** la propuesta previa no define limpieza de contexto en pools ni validación de issuer, audience y expiración de tokens. Debe exigirse identidad ligada al servidor y fallo cerrado.
2. **Roles:** falta comprobar propiedad de esquemas/funciones, privilegio CREATE sobre objetos resolubles y dependencias de bootstrap.
3. **CAS:** debe auditarse que *todos* los escritores utilicen el mismo mecanismo; una única ruta de actualización alternativa invalida la garantía de cotización vigente.
4. **Idempotencia:** la retención y caducidad de claves sigue sin política cerrada; debe reconciliarse un COMMIT desconocido antes de repetir la operación y resolver el caso rejected sin FK a cotización inexistente.
5. **RPC:** además del search_path fijo, deben comprobarse ACL de EXECUTE, rechazo de tenant arbitrario y retorno comercial siempre deshabilitado en errores.

## Limitaciones y próximos criterios de salida

Los 18 tests verifican estructura, cobertura y oráculos del JSON local; no prueban RLS real, permisos SQL, CAS, idempotencia ni seguridad RPC. Antes de pasar a un banco efímero autorizado: publicar y cotejar exactamente ambos archivos, completar la especificación de identidad y bootstrap, y obtener autorización independiente para cualquier ejecución PostgreSQL.

No se ejecutó PostgreSQL, GitHub Actions ni OSRM. Sin cartografía, costos, tienda, workflows, Supabase, staging, producción o datos reales.
