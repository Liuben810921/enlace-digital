# F2 — Propuesta incremental para staging existente (NO EJECUTABLE)

**Fecha:** 2026-11-10. **Base autorizada:** `7cda6febbc48eef6b14e6b5765a5563221e58250`. Alcance: diseño GitHub/offline; **no contiene SQL ejecutable**. Fundamento: informes F0 y F1. Ninguna consulta nueva a Supabase ni a filas de clientes.

## Decisión de arquitectura
**Recomendada:** migración aditiva versionada, con preflight fail-closed, columna o estructura de identidad `NORM-v1` derivada por un único componente de servidor, auditoría de colisiones históricas, consolidación manual aprobada, índice UNIQUE por cliente+versión+identidad y posterior RPC transaccional de upsert. En paralelo, RPC de lectura con `id::text` para IDs `int8`, conservando `cliente_numero int4`. **No** reutilizar ni ejecutar `staging_esquema_unico_v4_no_ejecutar.sql` sobre staging actual.

**Alternativas rechazadas:** reconstrucción de tablas (riesgo datos/FK); `SELECT` seguido de `INSERT` (carrera); índice UNIQUE antes de resolver colisiones (fallo de migración); deduplicación por receptor o teléfono (mezcla de identidades); convertir bigint a Number (pérdida irreversible); habilitar `anon`/`authenticated` sobre tablas (ampliación de superficie).

## Preflight obligatorio (futuro, requiere nueva autorización)
| Control | Requisito / acción si falla |
|---|---|
| P01 | Identidad de proyecto staging exacta; detener ante proyecto distinto |
| P02 | Comparar tablas/columnas/tipos/defaults con F0; detener ante drift |
| P03 | Verificar PK/FK, ON DELETE CASCADE, índices y dependencias; no reemplazar |
| P04 | Comprobar RLS, policies y grants por rol; no ampliar privilegios |
| P05 | Revisar funciones RPC, SECURITY DEFINER/INVOKER, search_path, owners y EXECUTE |
| P06 | Confirmar estado `ed_cliente_cuba_direccion_ck NOT VALID`; no validar sin examen autorizado |
| P07 | Verificar ownership y usos de secuencias, sin reset ni suposiciones sobre nextval |
| P08 | Revisar presencia de duplicados históricos **solo con autorización posterior**, inicialmente conteos agregados sin PII |
| P09 | Inventariar FK externas, pedidos, snapshots y referencias a IDs antes de consolidar |
| P10 | Verificar respaldos restaurables, ventana de cambio, rollback y feature flags OFF |
| P11 | Probar determinismo Unicode entre runtime servidor y persistencia; NFC/White_Space |
| P12 | Probar serialización exacta int8 a texto en frontera PostgREST/RPC, sin parseo numérico |

## Delta por objeto (plan, NO DDL)
| Objeto | F0 comprobado | Delta futuro propuesto | Protección |
|---|---|---|---|
| `public.clientes_oficiales` | `numero int4`, restricción cubana NOT VALID, sin DML service_role | **Ningún cambio** para dedup ni bigint; tratar NOT VALID aparte | Preservar PK/FK y residencia |
| `public.clientes_destinatarios` | `id int8`, FK cliente_numero int4, RLS | Exponer `id::text` en RPC/contrato API, sin alterar columna | Nunca agrupar personas por dirección |
| `public.clientes_direcciones_entrega` | `id int8`, FK int4, índice no único cliente, RLS | Identidad NORM-v1 versionada y UNIQUE por cliente+versión+clave, tras auditoría | Conservar ID, logística, receptor, referencias e historial |
| Índices | PK únicas por id; sin UNIQUE por dirección | Crear índice UNIQUE **solo después** de tratar duplicados; asegurar semántica de comparación de bytes, NULL y collation | No bloquear producción ni asumir índice válido |
| Secuencias | 3 existentes; asociación de cliente no probada | No tocar, no reseed; verificar dependencias antes de cambio futuro | Evitar colisiones de PK |
| RPC cliente/direcciones | 10 funciones; 8 DEFINER, 2 INVOKER | Nueva RPC de upsert y RPC de lectura exacta con contrato versionado; no sustituir funciones sin pruebas | Ownership, session token, search_path fijo, EXECUTE mínimo |
| RLS/grants | Sin grants directos anon/authenticated; service_role DML hijas | Mantener política actual y mínimo privilegio | No conceder acceso público |
| Edge/frontend | IDs Number seguros; lookup+insert no atómico | Adaptador ID-STRING-v1 y ruta de RPC atómica en fase posterior | Feature flag OFF; checkout real OFF |

## Identidad NORM-v1 y duplicados históricos
- La clave de dirección es `cliente_numero` + versión `NORM-v1` + provincia, municipio, barrio y dirección normalizadas. Mantener **NFC**, White_Space colapsado, comparación de bytes; **no** lower, transliteración, pérdida de acentos ni collation dependiente de locale.
- **Decisión pendiente técnica:** formato persistido de clave: campos canónicos con UNIQUE multicolumna o bytes codificados de forma no ambigua y versionada. No concatenar campos sin longitud/escape (colisiones por delimitadores). Si se usa hash, conservar verificación de igualdad del material canónico y definir tratamiento de colisiones.
- Evitar UNIQUE con NULL ambiguo: barrio normalizado a cadena vacía; todos los componentes de clave no nulos y validados. El índice y el algoritmo deben usar la misma representación exacta.
- Antes de añadir UNIQUE: cuantificar grupos duplicados de manera agregada, sin extraer PII; si existen, inventariar referencias, preparar mapa old_id→canonical_id, snapshots inmutables y revisión manual autorizada. **NO-GO si hay duplicados sin resolver**. No borrar ni fusionar automáticamente, y no actualizar IDs de pedidos sin preservar copia histórica.
- No confundir reutilizar ubicación con sobrescribir receptor: el pedido debe conservar snapshot de receptor/teléfono/referencias propio; nunca cruzar `cliente_numero`.
- Aislamiento: upsert bajo UNIQUE/ON CONFLICT transaccional, filtrado por cliente autenticado; la versión de API debe indicar si la dirección fue reutilizada, sin prometer un orden determinista entre peticiones concurrentes.

## Secuencia futura de cambios, solo tras autorización
1. **M0** congelar baseline, respaldo/restauración ensayados y preflight P01–P12.
2. **M1** incorporar estructura aditiva de identidad, sin UNIQUE y sin alterar rutas activas.
3. **M2** backfill por lotes con control de consistencia y rollback, sin borrar registros.
4. **M3** auditoría de colisiones; revisión humana y resolución referencial explícita.
5. **M4** añadir UNIQUE cuando la evidencia demuestre cero conflictos; validar índice.
6. **M5** introducir RPC de upsert atómico y lectura `id::text` con grants mínimos y contrato versionado.
7. **M6** pruebas aisladas de seguridad, 20 solicitudes concurrentes, reintentos, IDs > 2^53, cliente cruzado y errores.
8. **M7** activar solo en staging mediante autorización independiente y feature flag, monitorizar y preparar reversión; **no activar pedidos reales**.

## Aceptación y pruebas (futuras, no ejecutadas)
| Caso | Criterio |
|---|---|
| A01 | Baseline coincide con F0 o se documenta y aprueba drift |
| A02 | Migración incremental idempotente sin DROP/TRUNCATE ni pérdida de filas |
| A03 | PK/FK y snapshots históricos intactos |
| A04 | NORM-v1 produce misma identidad para NFC y espacios equivalentes |
| A05 | NORM-v1 distingue tildes, mayúsculas, puntuación y apartamentos |
| A06 | Colisiones históricas inventariadas, cero pendientes antes de UNIQUE |
| A07 | UNIQUE impide duplicados con 20 solicitudes simultáneas |
| A08 | Upsert no modifica datos de otro cliente |
| A09 | Receptor y teléfono se conservan en snapshot de pedido |
| A10 | IDs int8 extremos viajan como strings sin pérdida |
| A11 | JSON numbers inseguros se rechazan, cliente_numero int4 sigue numérico |
| A12 | Sin nuevos grants a anon/authenticated; RPC EXECUTE mínimo |
| A13 | RLS, SECURITY DEFINER, search_path y ownership auditados |
| A14 | Rollback ensayado, backup restaurable, feature flag OFF |
| A15 | Sin cambios a producción, correo ni pedidos reales |
| A16 | CI estático y pruebas de staging con resultados verificables por SHA |

## Reversión y condiciones NO-GO
- **Esta entrega:** `git revert` de documentos y pruebas; no hay migración ejecutada.
- **Futura migración:** reversión por fases; desactivar primero la nueva ruta con feature flag, restaurar compatibilidad API; preservar columnas/índices hasta confirmar que ningún escritor depende de ellos. Restauración desde backup solo con ensayo y aprobación, nunca rollback destructivo automático.
- **NO-GO:** duplicados sin resolver, permisos ampliados, validación histórica desconocida, índice inválido, drift, precisión bigint incierta, fallo de aislamiento o de CI, rollback no probado, staging equivocado.
- **Límite:** no se consultaron filas ni metadatos nuevos en F2. No se puede asegurar que no existan duplicados ni que las futuras operaciones sean seguras hasta su verificación autorizada.
