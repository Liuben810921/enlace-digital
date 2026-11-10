# Plan de implementación por fases — NO EJECUTABLE

**Fecha:** 2026-11-10. **Base autorizada:** `515dbc91cab1522a9652e6fe5a24fad2d2696b5f`. **Alcance de esta entrega:** documentación GitHub exclusivamente, sin consultas a Supabase, SQL ejecutado, código operativo, despliegue, producción, servicios, correos ni pedidos reales.

## Evidencia de CI #407
Captura de la interfaz GitHub Actions facilitada por el propietario: workflow `staging-auth-static-check`, ejecución **#407**, evento **Commit/push**, commit corto `515dbc9`, rama `audit/registro-staging-aislado-20261109`, icono verde de éxito, duración mostrada **24 s**. La captura acredita el resultado global visible **Success**; no se han obtenido el run_id numérico de API, job_id, logs ni el detalle de cada paso de #407 por el conector. No atribuir al #407 resultados de jobs de otras ejecuciones. Ejecuciones anteriores #404 y #406 mostraron fallos estáticos corregidos posteriormente. **Estado de evidencia:** CI global #407 confirmado visualmente; pasos individuales no auditados.

## Principios de seguridad y compatibilidad
- PR #2 se mantiene en borrador y **no se fusiona**. `ED_REAL_CHECKOUT_ENABLED=false` y guardas de staging siguen vigentes.
- No reejecutar `sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql`: presupone ausencia de objetos que históricamente existen en staging. No inferir que el estado histórico sigue igual; toda implementación requiere preflight actualizado y autorización separada.
- Distinguir `clientes_oficiales.numero` (`int4`) de `clientes_destinatarios.id` y `clientes_direcciones_entrega.id` (`int8`).
- Preservar datos, PK/FK, snapshots históricos y permisos; sin grants directos a `anon` o `authenticated` por defecto. `service_role` solo con privilegios mínimos comprobados; RPC con validación de sesión, ownership, `search_path` fijo y `EXECUTE` restringido.
- Las pruebas estáticas son evidencia de contrato, no demuestran atomicidad, aislamiento real, migración exitosa ni ausencia de pérdida de datos.

## Fases, dependencias y autorizaciones futuras

| Fase | Entrega técnica futura | Dependencias y evidencia requerida | Criterio NO-GO | Reversión prevista |
|---|---|---|---|---|
| F0 | Preflight de metadatos staging de solo lectura | Nueva autorización, identidad de proyecto, esquema actual, constraints `NOT VALID`, grants, secuencias, conteos agregados sin PII | Proyecto equivocado, objetos desconocidos o permisos inconsistentes | Sin cambios; descartar informe |
| F1 | Contratos versionados NORM-v1 e ID-STRING-v1 | F0; casos ficticios de dirección; consumidores UI/Edge/REST identificados | Ambigüedad en tildes, mayúsculas, apartamentos o tipos JSON | Revertir especificación |
| F2 | Diseño y revisión de migración incremental | F0–F1; diferencias por objeto, índice único, estrategia de duplicados históricos, plan de backup | DDL destructivo, preflight obsoleto, pérdida de FK o de datos | Migración compensatoria y restauración previamente ensayada |
| F3 | Diseño de RPC de dirección atómica | F1–F2; clave cliente+ubicación+dirección normalizada, unicidad en BD, UPSERT transaccional, sesión y ownership | SELECT/INSERT separados, grants excesivos, colisiones sin resolver | Volver a ruta previa bajo feature flag, preservando registros |
| F4 | Diseño de adaptadores bigint Edge/UI | F1–F3; IDs int8 como cadenas decimales desde origen, aceptación transitoria de números JSON seguros | Conversiones `Number` de int8 o serialización numérica insegura en REST | Versionado API y adaptador anterior compatible |
| F5 | Pruebas estáticas y simulaciones aisladas | F2–F4; casos de migración, concurrencia, límites int8, autorización cruzada y reintentos | Tests que solo comprueban texto sin cobertura de comportamiento | Revertir pruebas/propuestas, sin afectar datos |
| F6 | Ensayo funcional staging autorizado por separado | F0–F5; respaldo probado, datos ficticios, 20 solicitudes paralelas, pruebas de rollback | Cualquier alteración no autorizada o servicio real activado | Transacción/compensación, restauración y auditoría |
| F7 | Evaluación de activación futura | F6 exitoso y nueva autorización expresa; PR y seguridad revisados | Producción, correo o checkout real sin aprobación independiente | Plan de reversión específico por servicio |

## Contratos y pruebas por riesgo

### M — Migración incremental
- **Precondiciones:** identificar versión real de esquema, tipos int4/int8, secuencias, índices, PK/FK, RLS, grants, funciones y estado `ed_cliente_cuba_direccion_ck NOT VALID`; inventariar duplicados y referencias antes de agregar UNIQUE.
- **Diseño:** diferencia aditiva e idempotente por objeto, separación de preflight/DDL/backfill/validación; no `DROP`, `TRUNCATE` ni recreación de tablas existentes. No asumir que la restricción `NOT VALID` ya está validada.
- **Pruebas futuras M01–M05:** M01 ejecución repetida sin cambios inesperados; M02 preservación de filas y FKs; M03 rechazo seguro ante diferencias; M04 secuencias e índices consistentes; M05 reversión/restore probado.

### D — Deduplicación atómica
- **NORM-v1 propuesto:** Unicode NFC, trim y colapso de espacios Unicode; conserva tildes, mayúsculas, puntuación, número de casa y apartamento como significativos. Clave versionada por `cliente_numero`, provincia, municipio, barrio y dirección. Referencias, receptor y teléfono fuera de clave.
- **Diseño:** operación única de BD con restricción UNIQUE coherente con la normalización y `ON CONFLICT`/UPSERT; no mutex local. Consolidación histórica solo con mapa de referencias y preservación de snapshots, nunca eliminación automática.
- **Pruebas futuras D01–D06:** D01 20 solicitudes simultáneas generan un único ID; D02 aislamiento entre clientes; D03 normalización determinista; D04 edición de referencias no duplica; D05 reintento idempotente; D06 rollback preserva historial.

### I — IDs bigint
- **Contrato ID-STRING-v1:** IDs de destinatarios y direcciones `int8` se devuelven como texto decimal desde PostgreSQL/RPC/REST, no tras un parseo JSON numérico inseguro. Regex `^[1-9][0-9]*$`, rango máximo `9223372036854775807`, sin exponentes, ceros iniciales, negativos ni decimales. Validación con `BigInt` sin convertir a `Number`.
- **Compatibilidad:** clientes antiguos solo pueden enviar números JSON positivos `Number.isSafeInteger`; normalización a string en la frontera y versión explícita de API. No confundir con `cliente_numero int4`.
- **Pruebas futuras I01–I06:** I01 valores 1, 9007199254740991, 9007199254740992 y 9223372036854775807 intactos; I02 entradas inválidas rechazadas; I03 ownership de destinatarios; I04 filtros exactos; I05 transición cliente antiguo/nuevo; I06 rollback de API sin cambiar PK.

## Matriz de autorización
- **Permitido ahora:** GitHub documental, lectura de archivos del repositorio y validación estática sin ejecución de SQL.
- **Requiere nueva autorización específica:** F0 (lectura Supabase), cualquier propuesta SQL ejecutable, cambios en controlador/cliente, pruebas funcionales, cambios de esquema, despliegues, ajustes de permisos y toda activación.
- **Nunca implícito:** fusionar PR #2, modificar producción, activar correos, pedidos reales o servicios de pago.

**Reversión de esta entrega:** `git revert` de los commits documentales y del eventual validador estático; no existe cambio de BD que revertir.
