# F6-B10 — Diseño offline de acceso mínimo para auditoría histórica NORM-v1

Fecha: 2026-11-10. Base `0204ed8f1248864a5672065b4b171e7657d38c47`. GitHub Actions #519 (42890119646): SUCCESS. **Solo diseño, NO SQL ejecutado, NO acceso a Supabase ni datos reales.** No crear roles, grants, funciones, políticas, índices o servicios.

## Contexto verificable (F6-B9)
`public.clientes_direcciones_entrega` contiene las cinco columnas de identidad `cliente_numero int4`, `provincia text`, `municipio text`, `barrio text`, `direccion text`, todas NOT NULL. La tabla tiene RLS habilitado sin políticas y FORCE RLS desactivado. `postgres`, `service_role` y `supabase_read_only_user` pueden SELECT y omiten RLS; `supabase_read_only_user` hereda `pg_read_all_data`. `anon` y `authenticated` carecen de SELECT. **No se identificó un rol preexistente con acceso mínimo** entre los examinados. Los datos históricos no fueron leídos.

## Comparación de alternativas (propuestas, no implementadas)

| Alternativa | Ventajas | Riesgos y limitaciones | Decisión |
|---|---|---|---|
| A. Rol dedicado de auditoría, sin LOGIN o con autenticación administrativa efímera, solo lectura de columnas necesarias | Separación de funciones; sin acceso a otras tablas; revocable | Requiere aprobación de DDL/grants; un SELECT de las cinco columnas aún expone direcciones; herencia, PUBLIC, SECURITY DEFINER y RLS requieren revisión | **Preferida solo si se justifica acceso y se demuestra no exposición** |
| B. Políticas RLS restrictivas para rol dedicado, sin BYPASSRLS, y permisos mínimos | Defensa en profundidad y trazabilidad | RLS filtra filas, no anonimiza direcciones; sin políticas actuales el rol no vería filas; crear política puede alterar superficie de acceso; FORCE RLS afecta al propietario; errores en USING pueden revelar datos | **Complementaria, no sustituto de privilegios de columna ni de supresión** |
| C. Ejecución administrativa controlada con rol existente (`postgres` o read-only global) | No requiere cambios de esquema; viable para un análisis puntual | Privilegios excesivos, BYPASSRLS, acceso global; logs y errores; `service_role` especialmente peligroso | **NO-GO por defecto**; solo excepcional con aprobación independiente, supervisión y controles adicionales |

## Principio de acceso mínimo
1. El objetivo futuro es una **única evaluación de colisiones por identidad** NORM-v1, exclusivamente en staging. No se autoriza consulta ahora.
2. Identidad: `(cliente_numero, NORM-v1(provincia), NORM-v1(municipio), NORM-v1(barrio), NORM-v1(direccion))`. NFC, 25 Unicode White_Space, rechazos C0/C1 no permitidos, U+200B, U+FEFF; comparación de bytes UTF-8, nunca collation lingüística. No unir `clientes_oficiales` ni `clientes_destinatarios`.
3. Rol propuesto: sin `SUPERUSER`, `BYPASSRLS`, `CREATEDB`, `CREATEROLE`, `REPLICATION`, `pg_read_all_data`, `pg_write_all_data`, `pg_monitor` ni membresías heredadas de acceso amplio. Sin DDL, DML, CREATE, EXECUTE de funciones peligrosas, ALTER DEFAULT PRIVILEGES, acceso a secretos, extensiones o red. No usar `service_role` en frontend.
4. Si se aprobara un rol dedicado, conceder `USAGE` solo sobre el esquema necesario y `SELECT` **por columna** únicamente sobre `cliente_numero`, `provincia`, `municipio`, `barrio`, `direccion`; sin SELECT a nombres, teléfonos, ID, timestamps, geolocalización ni tablas relacionadas. Verificar grants heredados, `PUBLIC`, ownership, funciones SECURITY DEFINER y privilegios efectivos, no solo grants directos.
5. **Advertencia:** incluso ese SELECT por columna revela direcciones completas al operador. Una auditoría realmente minimizada debería preferir un mecanismo revisado de cómputo encapsulado que solo emita un estado permitido; diseñarlo implicaría otra autorización de cambios y una auditoría de seguridad. No proponer función SECURITY DEFINER sin revisión independiente.
6. RLS: `ENABLE ROW LEVEL SECURITY` ya activo; ausencia de políticas implica deny para rol sin BYPASSRLS. Cualquier política futura debe revisarse para no ampliar acceso de `anon`/`authenticated`, no alterar reglas existentes y no conceder visibilidad global inadvertida. No activar `FORCE ROW LEVEL SECURITY` ni cambiar políticas en esta etapa.

## Privacidad y supresión
- Salida por defecto **`SUPPRESSED`**, sin conteos, booleanos, hashes, grupos, claves, IDs, direcciones, provincias, municipios, fechas ni ejemplos.
- Un `0`, `NO_SIGNAL` o `REVIEW_REQUIRED` también pueden revelar pertenencia o cambios por diferencia temporal. No se divulgan sin revisión independiente.
- Umbral `k` **sin definir**: fijarlo requiere análisis de población, conocimiento auxiliar y amenaza de inferencia. No adoptar arbitrariamente `k=5` ni `k=10`.
- **Una sola consulta** tras aprobación independiente; no filtros adaptativos, reintentos, particiones, comparaciones por fechas, ni consultas de exploración.
- `NULL`, vacío, longitud inválida, controles no permitidos, errores de Unicode o diferencias de normalización: abortar con `SUPPRESSED` y **NO-GO**; no excluir silenciosamente filas. `barrio NOT NULL` no equivale a contenido válido.

## Límites operativos y costos gratuitos
- Sin despliegue, instancia adicional, proveedor externo, función Edge, servicio de pago, correo ni SMS. Diseño basado en PostgreSQL/Supabase staging existente y GitHub Actions; no implica costo incremental en esta fase.
- Una eventual ejecución real debe comprobar límites y uso del plan gratuito, carga actual y presupuesto de recursos **antes** de ejecutar. No afirmar cuota gratuita garantizada.
- Propuesta inicial conservadora: transacción `READ ONLY`, `statement_timeout <= 5s`, `lock_timeout <= 1s`, sin cambios globales, sin temporales persistentes, sin `EXPLAIN ANALYZE`, sin exportaciones ni logging de parámetros/filas. Si no se puede cumplir, **NO-GO**.
- Revisar destino de logs, historial SQL, retención y acceso administrativo; un error puede contener información. Nunca registrar datos reales.

## Plan de validación antes de autorizar cambios
**G10-01** Verificar CI y contrato NORM-v1, fixtures 27/27 staging (tres excluidos por frontera).
**G10-02** Aprobar modelo de amenazas, salida `SUPPRESSED`, criterio de divulgación y política k.
**G10-03** Revisar diseño de rol, privilegios heredados, columnas y exposición real de direcciones.
**G10-04** Revisar RLS, ausencia de políticas, BYPASSRLS y ausencia de escalada por funciones.
**G10-05** Validar `NULL`, vacíos, caracteres prohibidos y límites sin consultar filas reales.
**G10-06** Revisar costos gratuitos, timeouts, carga, logging, retención y presupuesto de una consulta.
**G10-07** Aprobar rollback verificable de cualquier futuro grant/política/rol, con registro de estado previo.
**G10-08** Obtener autorización **independiente para cualquier modificación de permisos** en staging.
**G10-09** Obtener autorización **separada para cualquier lectura histórica**, incluso agregada.
**G10-10** Mantener producción, pedidos, correos, clientes y servicios sin cambios.

## Reversión futura y estado
Esta fase solo agrega documentación, validador y workflow GitHub; `git revert` revierte cambios documentales. Si más adelante se autoriza un rol/grant/política, guardar previamente su definición, probar permisos con fixtures y planificar REVOKE/DROP/restore por transacción y revisión, sin asumir reversión automática de logs ni lecturas. Si se autoriza una lectura, **no puede deshacerse la exposición**: minimizar y aprobar antes.

**Decisión actual: F6-B10 diseño preparado; acceso histórico NO-GO.** La próxima solicitud será únicamente para una revisión de seguridad y eventual autorización separada; no para ejecutar SQL ni consultar clientes de inmediato.
