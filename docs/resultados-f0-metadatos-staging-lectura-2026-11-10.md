# F0 — Preflight real de metadatos de Supabase staging (solo lectura)

**Fecha:** 2026-11-10. **Commit de partida:** `961b2fb671e06bd8f5f9a11b8404867ec7ddaf7f`. **Proyecto consultado exclusivamente:** `xqahthghvozeigbojhyi` / `enlace-digital-staging` / `us-east-1` / `ACTIVE_HEALTHY` / PostgreSQL 17. No se consultó la base de producción, ni registros de clientes, ni datos personales. Consultas de catálogo exclusivamente: `information_schema.columns`, `pg_class`, `pg_namespace`, `pg_constraint`, `pg_index`, `pg_proc`, `pg_policies`, `pg_depend`, `pg_attribute` y comprobaciones de privilegios. **SELECT de metadatos, no DDL/DML**.

## Matriz F0: resultados verificados
| Control | Evidencia actual | Consecuencia |
|---|---|---|
| F0-01 | Staging identificado y saludable; producción es proyecto distinto, no consultado | Continuar solo con staging |
| F0-02 | Tablas `clientes_oficiales`, `clientes_destinatarios`, `clientes_direcciones_entrega` existentes; owner `postgres` | NO-GO para ejecutar v4 original que exige ausencia |
| F0-03 | `clientes_oficiales.numero` `int4`; `cliente_numero` en ambas hijas `int4`; `id` de hijas `int8` | Contrato ID-STRING-v1 necesario en frontera API |
| F0-04 | PK de las tres tablas válidas; FK hijas -> `clientes_oficiales(numero)` válidas con ON DELETE CASCADE; cliente auth_user_id -> auth.users | No reescribir claves ni eliminar historial |
| F0-05 | `ed_cliente_cuba_direccion_ck` sigue `NOT VALID`; resto de constraints enumeradas válidas | Validación histórica pendiente; no afirmar que todos los registros cumplen |
| F0-06 | Índices de hijas: PK única por id e índice NO único por cliente_numero; no UNIQUE de identidad de dirección | Carrera SELECT/INSERT no está protegida por unicidad |
| F0-07 | RLS enabled en tres tablas; FORCE RLS false; 0 políticas `pg_policies` | Acceso a través de funciones privilegiadas requiere auditoría posterior |
| F0-08 | `anon` y `authenticated` sin DML/SELECT directo en las tres; `service_role` SELECT/INSERT/UPDATE/DELETE en hijas, ninguno en `clientes_oficiales` | Conservar mínimos; no ampliar permisos |
| F0-09 | 10 funciones de cliente/correo identificadas; 8 SECURITY DEFINER, 2 INVOKER; owner postgres; search_path vacío; ninguna EXECUTE para anon/authenticated | Auditar ownership y límites de RPC antes de cambios |
| F0-10 | `service_role` EXECUTE en 9/10; `public.ed_cliente_registrar_privado` sin EXECUTE para service_role | Wrapper de registro sigue siendo dependencia |
| F0-11 | Tres secuencias existentes; hijas `id_seq` asociadas por dependencia interna `i` a sus IDs, service_role USAGE; `clientes_oficiales_numero_seq` no mostró asociación de ownership en pg_depend (puede usarse explícitamente en funciones) | No asumir secuencia owned ni reiniciarla |
| F0-12 | Columnas auxiliares de ubicación: latitud, longitud, distancia_km, punto_salida_id, ruta_version, calculado_en, usado_en | Preservar metadatos logísticos en migración incremental |

## Diferencias con plan anterior
- Confirmada de nuevo incompatibilidad del borrador `staging_esquema_unico_v4_no_ejecutar.sql` con staging existente; **no ejecutarlo**.
- No hay índice UNIQUE por cliente+dirección normalizada; el diseño de UPSERT requiere decidir NORM-v1, revisar duplicados históricos y referencias antes de añadir restricción.
- El plan de compatibilidad bigint sigue justificado por tipos reales int8, pero **no se probó serialización PostgREST** ni el comportamiento del frontend.
- La restricción `NOT VALID` y secuencia de clientes sin dependencia de ownership visible son puntos de preflight obligatorios; no equivalen por sí solos a datos inválidos ni a fallo de generación.
- La autorización F0 **no incluyó lectura de filas**; no se pueden afirmar conteos, existencia/ausencia de duplicados, valores máximos de secuencia, validez histórica de datos ni idempotencia real.

## Bloqueos y próximas pruebas futuras
**NO-GO F1/F2:** no ejecutar migraciones ni modificar índices, grants, RLS, funciones o datos sin autorización específica. Preparar solo contrato versionado y plan de backfill/rollback. Futuras comprobaciones autorizadas: duplicados agregados sin PII, dependencias completas de secuencia, estado real de serialización REST y pruebas aisladas de concurrencia, siempre bajo autorizaciones separadas.

**Reversión de F0:** no hay cambios en Supabase; los archivos GitHub documentales se pueden revertir con git revert.
