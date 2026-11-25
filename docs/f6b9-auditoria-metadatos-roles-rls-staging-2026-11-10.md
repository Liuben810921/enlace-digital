# F6-B9 — Revisión administrativa de metadatos, columnas, RLS y roles (staging, SOLO LECTURA)

Fecha: 2026-11-10. Base `1056632f28486f22b1854d7d8928a9663ec0fef1`. GitHub Actions #515 (`42889572617`) **SUCCESS**. Proyecto exclusivamente `enlace-digital-staging` (`xqahthghvozeigbojhyi`).

## Alcance ejecutado
Consultas `SELECT` solo sobre `information_schema.columns`, `information_schema.role_table_grants`, `pg_catalog.pg_class`, `pg_catalog.pg_namespace`, `pg_catalog.pg_policy` (conteo de definiciones), `pg_catalog.pg_roles` y `pg_has_role`/funciones de privilegios. **No se consultó `public.clientes_direcciones_entrega` ni ninguna otra tabla de clientes; no se leyeron filas, valores, conteos de clientes ni duplicados.** Sin DDL/DML, sin cambio de grants, sin `SET ROLE`, sin conexión como otro rol, sin producción.

## Estructura y nulabilidad
`public.clientes_direcciones_entrega`: **17 columnas**.
- Identidad NORM-v1: `cliente_numero int4 NOT NULL`, `provincia text NOT NULL`, `municipio text NOT NULL`, `barrio text NOT NULL` (tiene default), `direccion text NOT NULL`. Las cinco columnas tienen tipos esperados; `NOT NULL` **no** garantiza que las cadenas sean no vacías, válidas en NORM-v1 o dentro de límites.
- `id int8 NOT NULL`; `nombre_receptor text NOT NULL`; `telefono_receptor text NOT NULL`; `referencias text NOT NULL` con default.
- Logística nullable: `latitud float8`, `longitud float8`, `distancia_km numeric`, `punto_salida_id text`, `ruta_version text`, `calculado_en timestamptz`.
- `usado_en timestamptz NOT NULL` y `creado_en timestamptz NOT NULL`, ambos con default.
- No hay límites de caracteres declarados mediante tipo `varchar(n)` para las cadenas de identidad; validación de longitud NORM-v1 sigue siendo un requisito lógico separado.
- Riesgo `barrio NULL` en filas existentes reducido por `NOT NULL`, pero el protocolo conserva validación de cadenas vacías, caracteres prohibidos y semántica de default; no se infiere limpieza histórica.

## RLS
Tabla ordinaria `relkind=r`, owner `postgres`, `relrowsecurity=true`, `relforcerowsecurity=false`, **0 políticas RLS**. Habilitar RLS sin políticas no demuestra aislamiento para roles con `BYPASSRLS` ni para el owner sin FORCE.

## Roles y permisos efectivos (metadatos)
| Rol | LOGIN | SELECT efectivo tabla | BYPASSRLS | Notas |
|---|---|---|---|---|
| `anon` | no | no | no | Sin SELECT sobre columnas de identidad |
| `authenticated` | no | no | no | Sin SELECT sobre columnas de identidad |
| `authenticator` | sí | no | no | No habilita consulta |
| `dashboard_user` | no | no | no | `CREATEROLE` y `CREATEDB`; sin SELECT directo |
| `service_role` | no | sí | sí | Grant SELECT explícito, también DML existente según F6-A |
| `postgres` | sí | sí | sí | Owner, `CREATEROLE`, `CREATEDB`, `pg_read_all_data` |
| `supabase_read_only_user` | sí | sí | sí | Miembro y usuario de `pg_read_all_data` y `pg_monitor`; lectura amplia |

Grants explícitos SELECT observados en `information_schema.role_table_grants`: `postgres` (grantable YES) y `service_role` (grantable NO). El SELECT efectivo de `supabase_read_only_user` deriva de roles de lectura global, no de grant explícito de tabla. Los roles `postgres` y `supabase_read_only_user` son miembros de `pg_read_all_data`; `service_role` no.

**Hallazgo principal:** no se identificó entre los roles examinados un rol que simultáneamente tenga acceso SELECT limitado a las cinco columnas necesarias, carezca de BYPASSRLS y no tenga privilegios de lectura más amplios. `supabase_read_only_user` es **read-only pero NO least privilege**. Esta revisión no certifica inexistencia de algún rol personalizado no incluido en el conjunto examinado.

## Evaluación de viabilidad / NO-GO
- Estructura compatible para una futura evaluación, pero no existe evidencia de higiene histórica ni de índice UNIQUE por identidad.
- Riesgo de lectura amplia y RLS bypass: **NO-GO** para ejecutar con `postgres`, `service_role` o `supabase_read_only_user` sin aprobación adicional y control de acceso diseñado.
- Aun con rol restringido, los riesgos de inferencia siguen sin resolver: universo pequeño, consulta repetida, salida booleana o conteo, historial/logging y políticas de supresión. F6-B8 conserva `SUPPRESSED` por defecto y umbral `k` sin aprobar.
- Si un rol limitado requeriría modificar grants, crear rol, RLS o funciones, **no hacerlo en F6-B9**: se necesita autorización separada de cambios en staging.
- No consultar clientes, direcciones, destinatarios ni duplicados; F6-B histórico, F6-C y F6-D permanecen **NO-GO**.

## Próximo paso autorizado solo mediante permiso posterior
Preparar offline una propuesta concreta de rol de lectura mínima y revisión de privacidad, sin aplicar cambios. Una autorización **distinta y explícita** será necesaria para cualquier creación de rol, modificación de grants/RLS o ejecución de una consulta agregada histórica. No se ha ejecutado ninguna.

## Reversión
Las únicas modificaciones son documentación, validador y workflow en GitHub; `git revert` para revertirlas. Supabase staging y producción permanecen sin cambios; pedidos reales, correos y servicios no se activaron.
