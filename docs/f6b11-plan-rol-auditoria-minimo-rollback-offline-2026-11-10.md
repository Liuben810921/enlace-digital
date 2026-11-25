# F6-B11 — Plan offline de implementación y reversión de acceso mínimo (NO EJECUTABLE)

Fecha: 2026-11-10. Base `92539901984906fb13aea6ad1d4e00219ce657af`. GitHub Actions #526 (42900527212): **SUCCESS**. Este documento es una especificación, **no autorización para SQL ni cambios**. En F6-B11 no se consultó Supabase, no se leyeron datos reales y no se modificaron roles, grants, RLS, funciones, código operativo, producción ni servicios.

## 1. Objetivo y dos autorizaciones separadas
Diseñar un rol exclusivo para una futura evaluación histórica NORM-v1 de `public.clientes_direcciones_entrega` en Supabase **staging**. **Autorización A**, todavía NO CONCEDIDA: crear/configurar/revertir roles, grants y eventualmente política RLS en staging, sin consultar filas. **Autorización B**, distinta y todavía NO CONCEDIDA: ejecutar una sola lectura histórica agregada con salida y privacidad aprobadas. A no implica B, B no implica A. El permiso para preparar este plan no implica ninguno.

## 2. Identidad y permisos propuestos
Identidad `(version='NORM-v1', cliente_numero, provincia, municipio, barrio, direccion)`, NFC + exactamente 25 Unicode White_Space, rechazo de controles inválidos, preservación de acentos/case/ceros y comparación de bytes UTF-8. Solo `public.clientes_direcciones_entrega`, no `clientes_oficiales` ni `clientes_destinatarios`.

Rol lógico propuesto `ed_staging_audit_norm_v1` (nombre de diseño, **NO CREADO**):
- Sin `SUPERUSER`, `BYPASSRLS`, `CREATEDB`, `CREATEROLE`, `REPLICATION`, `pg_read_all_data`, `pg_write_all_data`, `pg_monitor` ni membresías heredadas de acceso amplio. Preferir `NOLOGIN` con activación administrativa estrictamente autorizada, temporal y auditable; no conceder el rol a `postgres` como vía de acceso de uso ordinario ni a `service_role`, `anon` o `authenticated`.
- Permisos mínimos propuestos: `USAGE` en esquema `public`; `SELECT` **solo** en las columnas `cliente_numero`, `provincia`, `municipio`, `barrio`, `direccion` de `public.clientes_direcciones_entrega`. Sin SELECT de `id`, receptor, teléfono, referencias, geolocalización, timestamps ni otras tablas. Sin INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER, CREATE, DDL, EXECUTE de funciones privilegiadas, ALTER DEFAULT PRIVILEGES ni acceso a secretos.
- **Riesgo residual crítico:** SELECT por columna sigue exponiendo direcciones. La política de supresión protege la **salida del análisis**, pero no elimina el riesgo de que el operador consulte los campos directamente. Por eso la concesión de SELECT a un rol dedicado **no basta** para autorizar la lectura. Preferir evaluar un mecanismo encapsulado de agregación con salida minimizada y sin SELECT directo para el operador; una función SECURITY DEFINER solo podría considerarse tras auditoría específica de cuerpo, owner, `search_path`, permisos EXECUTE, errores y RLS, y requeriría otra autorización.
- Revisar permisos efectivos vía herencia, `PUBLIC`, `pg_has_role`, `has_table_privilege`, `has_column_privilege`, membresías, default grants y capacidad de `SET ROLE`. Un `NOLOGIN` por sí solo no impide abuso por roles miembros.

## 3. RLS: deny por defecto
F6-B9 confirmó `relrowsecurity=true`, `relforcerowsecurity=false`, **cero políticas RLS**. Un rol nuevo sin BYPASSRLS ni ownership ve cero filas incluso si recibe SELECT por columna. No probarlo con clientes reales en fase de permisos.
- Para futura auditoría, no crear una política `USING (true)` indiscriminada: expondría direcciones a ese rol. Una política por rol, con `TO` específico, requiere análisis de quién puede asumirlo y de la superficie de consulta; RLS limita filas, no columnas ni divulgación del contenido de filas autorizadas.
- No alterar RLS global, `FORCE ROW LEVEL SECURITY`, políticas existentes ni permisos de `anon`/`authenticated` sin evaluación independiente. Si el acceso no puede habilitarse sin exposición, **NO-GO**.
- Las alternativas (rol con SELECT directo, RLS restrictiva, ejecución administrativa con BYPASSRLS) **no** equivalen a una interfaz de agregado con privacidad garantizada.

## 4. Secuencia propuesta de implementación futura (NO ejecutar)
**Preflight A0:** autorización A específica, inventario de grants/policies/roles existente y sus definiciones para rollback, revisión de límites del plan gratuito y permisos Owner. Validar destino staging por ID; confirmar que no se toca producción.
**A1:** revisar propuesta SQL como artefacto separado, sin secretos y con identificadores explícitos; prohibir DDL dinámico, extensiones, SECURITY DEFINER no auditado y `GRANT ... TO PUBLIC`.
**A2:** probar en PostgreSQL desechable offline, con fixtures ficticios, que el rol no tiene acceso a otras tablas, columnas ni privilegios de escritura y que RLS niega filas por defecto.
**A3:** solo con autorización A y revisión, aplicar cambios mínimos en staging de forma transaccional cuando sea posible; comprobar metadatos de grants/RLS sin leer datos. No ejecutar lectura histórica.
**A4:** si una política permitiría lectura directa de direcciones, abortar y rediseñar mecanismo encapsulado; no ampliar acceso por conveniencia.
**A5:** registrar únicamente IDs de cambios, versiones y resultados de permisos, nunca valores de clientes. Revertir acceso inmediatamente tras prueba autorizada.

## 5. Pruebas exclusivamente sintéticas / offline
- T01: el rol no hereda `pg_read_all_data`, `BYPASSRLS`, `CREATEROLE`, `CREATEDB` ni roles amplios.
- T02: `SELECT` permitido solo para las cinco columnas de identidad, sin acceso a `id`, receptor, teléfono o ubicación GPS.
- T03: INSERT/UPDATE/DELETE, DDL, CREATE, TRUNCATE, EXECUTE privilegiado y `SET ROLE` no autorizado se rechazan.
- T04: RLS sin política devuelve cero filas ficticias y no permite inferir contenido; nunca usar clientes reales para comprobar denegaciones.
- T05: con fixtures ficticios, NFC, White_Space, bytes UTF-8, NULL, longitudes, caracteres prohibidos y colisiones entre clientes distintos mantienen contrato NORM-v1.
- T06: salida por defecto `SUPPRESSED`, sin `COUNT(*)`, booleanos, claves, hashes, IDs, grupos ni ejemplos.
- T07: no hay exposición mediante errores, logs, `EXPLAIN ANALYZE`, telemetría o historial SQL.
- T08: reversión restaura exactamente grants/policies/roles previos; revalidar ausencia de permisos nuevos.

## 6. Privacidad, límites y costos
- Política conservadora `SUPPRESSED`; umbral `k` aún **no definido**. No emitir `NO_SIGNAL`, `REVIEW_REQUIRED` ni `0` sin revisión independiente contra inferencia y ataques de diferencias. Presupuesto propuesto de **una sola consulta** futura, sin filtros, particiones ni reintentos.
- Una lectura histórica sigue **NO-GO** hasta aprobar una política de salida, tamaño de universo, NULL/vacíos, carga, logging, privilegios y autorización B.
- Diseño sin infraestructura adicional, sin proveedor externo, sin despliegue y sin costo incremental esperado en la fase offline. Cualquier creación de rol/política en staging debe revisarse respecto al plan gratuito y límites actuales antes de aplicarse; no prometer cuotas gratuitas.
- Ejecución futura, solo tras B: transacción `READ ONLY`, `statement_timeout` propuesto <= 5 s, `lock_timeout` <= 1 s, sin parámetros globales ni exportación. Si la carga o privacidad no permiten cumplir, **NO-GO**.

## 7. Rollback y riesgos no reversibles
- F6-B11: únicamente GitHub; revertir informe, validador y workflow con `git revert`.
- Cambios futuros A: capturar definiciones anteriores sin secretos; `REVOKE` de grants concedidos, `DROP POLICY` exclusivamente si fue creada por A, `DROP ROLE` exclusivamente si fue creado por A y no tiene dependencias; restaurar estados anteriores verificados. No aplicar DROP a objetos preexistentes. Evaluar `DROP OWNED` con extrema cautela, no usarlo indiscriminadamente.
- Revocar un permiso no borra información ya vista ni logs existentes. Por eso **el acceso a datos reales exige autorización B aparte**.
- Producción, pedidos reales, correos y servicios permanecen desactivados/sin cambios.

## 8. Gates de decisión
| Gate | Requisito | Estado F6-B11 |
|---|---|---|
| B11-01 | GitHub Actions #526 base | PASS |
| B11-02 | Diseño de rol y columnas mínimas | DOCUMENTADO |
| B11-03 | Evaluación de riesgo SELECT directo / RLS | DOCUMENTADO, RIESGO ABIERTO |
| B11-04 | Pruebas sintéticas de denegación | ESPECIFICADAS, NO EJECUTADAS |
| B11-05 | Privacidad y umbral k | NO-GO |
| B11-06 | Revisión de privilegios heredados y operadores | PENDIENTE |
| B11-07 | Revisión de costos, logs y timeouts | PENDIENTE |
| B11-08 | Autorización A de cambios de permisos | **NO AUTORIZADA** |
| B11-09 | Autorización B de lectura histórica | **NO AUTORIZADA** |
| B11-10 | Ningún SQL ni Supabase consultado en F6-B11 | PASS |

**Próximo paso recomendado:** revisión de seguridad del mecanismo encapsulado de agregación **offline**, para no otorgar acceso directo a direcciones. Solicitar autorización A solo cuando se apruebe un diseño que impida exposición directa. Solicitar B por separado, nunca implícitamente.
