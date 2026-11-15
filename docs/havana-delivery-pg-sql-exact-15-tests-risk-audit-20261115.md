# Cierre exacto SQL offline y auditoría de riesgos — 2026-11-15

**Base:** `68d78e0382edf9ee9acdfbfc2fdd24ecafa0e917`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Verificación reproducible realizada

Se recuperaron desde GitHub los dos archivos publicados y se reconstruyeron sus bytes exactos en `/mnt/data/ed_sql_exact`. Se comprobó que `git hash-object` local coincide con el Git blob de cada archivo:

| Archivo | Git blob verificado | SHA-256 local |
|---|---|---|
| `pg_disposable_schema_spec.sql` | `e80ad245d6748bdd161394c8abc74b36db9c2de9` | `1190f8ea041b2a922574f8dc4577ab367357d8eee9ff17cc374b105541aa738d` |
| `test_pg_disposable_schema_static.py` | `752278300e2b2ec67e58116c61f28dfa256add01` | `8d98fb9ae6474c8fa3605d780fa60239cce03a4fbbc1ecf687ff71b4054837b6` |

Comandos ejecutados:

```sh
cd /mnt/data/ed_sql_exact
git hash-object pg_disposable_schema_spec.sql test_pg_disposable_schema_static.py
sha256sum pg_disposable_schema_spec.sql test_pg_disposable_schema_static.py
python -m unittest -q test_pg_disposable_schema_static
python -O -m unittest -q test_pg_disposable_schema_static
```

**Resultados observados:** 15/15 pruebas correctas en Python normal y 15/15 en `-O` (ambos `Ran 15 tests ... OK`). Sin defectos reproducidos en este alcance, sin cambios en los dos archivos.

## Riesgos de diseño pendientes — revisión estática, NO pruebas PostgreSQL

1. **Identidad RLS (bloqueante crítico):** `current_setting('ed.tenant_id',true)` es un parámetro de sesión que no autentica al inquilino; un cliente capaz de fijarlo podría suplantar otra identidad. Sustituir por identidad vinculada de forma confiable por un servidor o mecanismo autenticado, y demostrar imposibilidad de alterarla desde el rol de aplicación. Probar acceso cruzado por SQL y RPC.
2. **Roles y permisos (bloqueante):** el SQL hace `GRANT USAGE ... TO ed_synth_app`, pero solo documenta la creación de roles en comentarios. En un PostgreSQL vacío, el script no es autosuficiente. Es deliberadamente una especificación revisable, no una migración ejecutable. Definir aprovisionamiento externo con roles `NOBYPASSRLS`, propiedad de tablas, `FORCE RLS`, `search_path` fijo y permisos explícitos mínimos.
3. **CAS de versiones (bloqueante):** el `UPDATE ... WHERE ... RETURNING` aparece únicamente comentado. Las restricciones CHECK no impiden por sí mismas carreras entre cambios de cesta, dirección, rutas y almacenes. Todos los escritores y la persistencia de cotización deben coordinarse sobre la misma fila/vector y transacción, con comprobación de exactamente una fila afectada.
4. **Idempotencia (bloqueante):** la clave única `(tenant_id,operation_id)` evita duplicados de clave, pero no implementa comparación atómica del hash, espera por transacción concurrente, reutilización del resultado, reconciliación de commit desconocido ni retención/caducidad. Además, `outcome='rejected'` requiere una semántica explícita de `quote_id` porque existe una FK obligatoria a `quotes`.
5. **RLS y política permisiva:** `ENABLE`/`FORCE` y `USING`/`WITH CHECK` están presentes, pero no se ha comprobado su eficacia bajo el rol propietario, funciones de seguridad, roles de aplicación o contexto de conexión. El test de texto no detecta toda posible vía de escalada.
6. **Seguridad comercial:** los CHECK fuerzan los dos flags comerciales a `false`; el campo `fee_cup` sigue siendo un valor sintético sin motor de distancias reales ni autorización para cobro. No hay reservas de stock implementadas.
7. **Seguridad de ejecución:** `BEGIN` y `ROLLBACK` reducen el riesgo de persistencia accidental de DDL, pero no equivalen a validación sintáctica, autorización para ejecutar ni aislamiento frente a un servidor real.

## Próximas comprobaciones permitidas sin infraestructura

Preparar offline casos negativos para identidad falsificada, ausencia de roles, conflictos CAS, dos solicitudes simultáneas con misma clave y distinto payload, resultados `rejected` sin cotización, serialización `40001`, deadlock `40P01` y commit desconocido. Definir oráculo de rechazo y ausencia de efectos parciales por escenario; cualquier prueba real en PostgreSQL desechable requiere autorización separada.

**Límites:** no se ejecutó SQL, PostgreSQL, GitHub Actions, OSRM ni cartografía; no se modificaron workflows, tienda, Supabase, staging, producción, clientes, pedidos o inventario; no se generaron costos.
