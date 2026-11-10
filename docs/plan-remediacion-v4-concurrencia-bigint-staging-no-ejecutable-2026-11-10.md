# Plan técnico de remediación staging — DOCUMENTAL, NO EJECUTABLE

Fecha 2026-11-10. Base autorizada `d060f4a77be451d2f0b076c7e0919f82b8a20ea7`. Únicamente GitHub offline; ninguna consulta o cambio en Supabase. Fuentes: `docs/matriz-dependencias-rutas-clientes-staging-offline-2026-11-10.md`, `sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql`, `supabase/functions/enlace-cliente-auth-staging/index.ts`. Las evidencias de staging son históricas, no verificadas en esta etapa.

## Decisión 1 — migración v4 incompatible (P0)
**Evidencia:** el borrador `staging_esquema_unico_v4_no_ejecutar.sql` contiene un preflight que aborta si ya existen `clientes_destinatarios`, `clientes_direcciones_entrega`, columnas de `clientes_oficiales`, secuencia o `ed_cliente_cuba_direccion_ck`; la auditoría histórica P01–P08 ya observó las dos tablas y la restricción NOT VALID. El archivo es un borrador ejecutable en su sintaxis, **no autorizado ni adecuado para reejecución**.

**Alternativa A:** reinicializar staging (destructivo; no recomendado). **Alternativa B (recomendada):** diseñar nueva migración incremental y condicionada a un preflight actualizado, con diferencias de catálogo/constraints/grants, sin re-crear objetos existentes y sin alterar datos previos. **Alternativa C:** omitir v4 y documentar esquema vigente como baseline; válido solo si se comprueba integridad y trazabilidad de migraciones.

**Dependencias:** identificar versión y hash de objetos, PK/FK, restricciones NOT VALID, secuencia, propietarios, grants y RLS; comparar con contratos v4, separar preflight de DDL, acordar plan de backfill y validación sin PII. No inferir tablas vacías. **Aceptación M01:** la propuesta incremental no presupone ausencia de tablas existentes; M02: no borra ni recrea datos; M03: secuencia e integridad conciliadas; M04: cualquier cambio requiere aprobación específica. **Reversión:** backup de staging autorizado, transacciones donde sean viables, migración compensatoria diseñada y validada; el plan actual se revierte con git revert.

## Decisión 2 — deduplicación concurrente de direcciones (P0)
**Evidencia:** `delivery-location-save` ejecuta SELECT de coincidencia por `cliente_numero,provincia,municipio,barrio,direccion` y luego INSERT o UPDATE. La secuencia de dos llamadas REST no es atómica. Dos solicitudes simultáneas pueden insertar la misma dirección.

**Alternativa A:** mutex local en Edge (insuficiente entre instancias; descartada). **Alternativa B (recomendada):** clave de deduplicación canónica por cliente + campos normalizados, índice UNIQUE/constraint de expresión o columna derivada, y operación atómica en RPC con `INSERT ... ON CONFLICT DO UPDATE ... RETURNING id` y autorización del cliente. Definir explícitamente normalización Unicode, mayúsculas, espacios, tildes y semántica de apartamento/referencias. **Alternativa C:** advisory lock transaccional por cliente+huella con SELECT/INSERT dentro de una única RPC; útil si no se puede expresar un índice único, pero más complejo y no sustituye invariantes.

**Dependencias:** inventario de duplicados históricos, decisión de merge conservando IDs referenciados y snapshots, índice sin bloquear escrituras sin plan de ventana, owner/RLS/grants de RPC, estrategia de errores de conflicto. **Aceptación D01:** 20 solicitudes paralelas crean una sola identidad lógica y devuelven el mismo ID; D02: clientes diferentes no comparten dirección; D03: edición de referencias no altera clave; D04: rollback ante fallo de transacción y reintento idempotente; D05: no modificar datos históricos ni referencias sin conciliación. **Reversión:** desactivar ruta nueva, revertir contrato/RPC bajo aprobación y preservar filas; nunca eliminar duplicados sin revisión.

## Decisión 3 — bigint y JavaScript (P1)
**Evidencia:** las PK de destinatarios y direcciones son `bigint/int8`, mientras `validId` exige `number` + `Number.isSafeInteger`; `recipient-save` recibe IDs numéricos. PostgreSQL admite IDs mayores que `Number.MAX_SAFE_INTEGER=9007199254740991`, con riesgo de pérdida de precisión o rechazo.

**Alternativa A:** mantener números y limitar secuencias a enteros seguros (frágil; no recomendada). **Alternativa B (recomendada):** serializar IDs bigint como cadenas decimales canónicas desde RPC/REST y extremo a extremo en JSON, almacenamiento local y filtros; parsear con regex `^[1-9][0-9]*$` y validar rango `<= 9223372036854775807` con BigInt sin conversión a Number. **Alternativa C:** introducir UUID públicos opacos con mapping interno a bigint; más robusto pero mayor migración y dependencia.

**Dependencias:** determinar serialización real de PostgREST/Supabase JS, auditoría de contratos UI y Edge, ordenaciones/comparaciones y filtros, índices, referencias de pedidos; diferenciar `clientes_oficiales.numero integer/int4` de IDs bigint. **Aceptación I01:** IDs 1, 9007199254740991, 9007199254740992 y 9223372036854775807 viajan sin pérdida; I02: rechazar 0, negativos, decimales, exponentes y >int8; I03: updates y ownership no cambian destinatario de otro cliente; I04: transición compatible con IDs existentes y snapshots. **Reversión:** feature flag de serialización, compatibilidad dual temporal y rollback de controlador/cliente únicamente tras autorización; no cambiar PK en caliente.

## Orden, gates y pruebas
| Fase | Dependencia | Puerta NO-GO |
|---|---|---|
| R0 | Preflight actualizado de staging y respaldo | Falta evidencia de versión, datos o permisos |
| R1 | Contrato documental de normalización y bigint | Decisión ambigua de identidad |
| R2 | Diseño incremental de esquema y RPC atómica | DDL que supone objetos ausentes o concede permisos amplios |
| R3 | Diseño de adaptadores UI/Edge sin implementar | Cualquier Number inseguro o endpoint sin ownership |
| R4 | Batería estática, integración aislada y pruebas de carrera futuras | Sin idempotencia, concurrencia o reversión demostrable |
| R5 | Despliegue futuro de staging, solo con nueva autorización | Correos/pedidos reales activos o impacto en producción |

**Pruebas estáticas actuales:** comprobar existencia de las tres evidencias en código, alternativas, decisiones y M01–M04/D01–D05/I01–I04; verificar `ED_REAL_CHECKOUT_ENABLED=false`. No prueban integridad real ni concurrencia.

**NO-GO actual:** no SQL ejecutado, no consultas a Supabase, no cambios operativos, no producción, no despliegue, no servicios/correos/pedidos reales. La única reversión necesaria ahora es revertir los commits documentales y de CI.
