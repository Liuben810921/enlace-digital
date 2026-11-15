# Especificación SQL sintética offline: evidencia y bloqueantes

**Base:** `4348b4250a52a82712897ddf82c1caa25b81bd59`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`

## Archivos nuevos

- `experiments/havana-osrm-portable/pg_disposable_schema_spec.sql` — borrador SQL revisable, **no autorizado para ejecutar**. Blob Git leído de GitHub: `e80ad245d6748bdd161394c8abc74b36db9c2de9`.
- `experiments/havana-osrm-portable/test_pg_disposable_schema_static.py` — 15 pruebas estáticas `unittest`. Blob Git leído de GitHub: `752278300e2b2ec67e58116c61f28dfa256add01`.

Se recuperaron los contenidos de ambos archivos después de su publicación y se verificaron los identificadores Git reportados. **No se han calculado SHA-256 locales ni ejecutado los tests Python sobre esos bytes exactos.**

## Comprobaciones efectivamente realizadas

Una revisión programática independiente del SQL recuperado por el conector confirmó **15/15 propiedades estáticas**: `ROLLBACK` final, ausencia de `COMMIT` activo, tres tablas, tres `ENABLE ROW LEVEL SECURITY`, tres `FORCE ROW LEVEL SECURITY`, tres políticas, tres `WITH CHECK`, flags comerciales bloqueados, unicidad idempotente, cuatro versiones, ausencia de grants directos sobre tablas, ausencia de funciones `SECURITY DEFINER` activas, ausencia de conectores externos, esquema sintético y ausencia de `BYPASSRLS` activo.

Estas comprobaciones **no son una ejecución de `unittest` ni prueban que PostgreSQL acepte o aplique el SQL**. El intento de descargar los archivos exactos desde `raw.githubusercontent.com` al contenedor falló: `curl: (6) Could not resolve host: raw.githubusercontent.com`.

## Alcance del diseño

El borrador define tablas `versions`, `quotes` e `idempotency`, claves compuestas por inquilino, restricciones de versión y aprobación comercial, RLS habilitada y forzada, y políticas `USING` / `WITH CHECK`. El CAS, la coordinación de bloqueos y las RPC de idempotencia se mantienen como **comentarios de especificación**, no como funciones implementadas.

**Bloqueante crítico de identidad:** `current_setting('ed.tenant_id')` es un marcador de diseño, **no una fuente de identidad autenticada**. No debe conectarse a clientes ni considerarse seguridad RLS hasta reemplazarlo por identidad confiable vinculada por el servidor. La provisión de roles también es externa y no está implementada.

El archivo comienza con `BEGIN` y termina en `ROLLBACK`; no se ha probado su sintaxis con un motor PostgreSQL. No hay garantías sobre creación de roles, permisos reales, atomicidad ni carreras entre dos conexiones.

## Reproducción pendiente

En un entorno que disponga de una copia exacta de los archivos GitHub:

```sh
cd experiments/havana-osrm-portable
git hash-object pg_disposable_schema_spec.sql test_pg_disposable_schema_static.py
sha256sum pg_disposable_schema_spec.sql test_pg_disposable_schema_static.py
python -m unittest -q test_pg_disposable_schema_static
python -O -m unittest -q test_pg_disposable_schema_static
```

Registrar resultados observados y corregir exclusivamente defectos reproducidos. Mantener PostgreSQL, Actions, OSRM, servicios empresariales y despliegues desactivados.

## Límites de esta etapa

No se modificó código operativo ni workflows. No se ejecutó PostgreSQL, GitHub Actions, OSRM, cartografía, Supabase, staging, producción ni datos reales. No se generaron costos.
