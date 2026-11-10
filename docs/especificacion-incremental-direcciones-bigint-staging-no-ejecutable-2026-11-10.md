# Especificación técnica única: incremental, deduplicación e ID bigint — NO EJECUTABLE

**Base:** `17ecb5f9d45d806bf2b115be58f068b161d014af`. **Alcance:** GitHub offline, solo documentación y verificaciones estáticas. Este archivo NO contiene SQL ejecutable, instrucciones de despliegue ni autorización para alterar Supabase, código operativo o producción. Prevalece como detalle del `docs/plan-remediacion-v4-concurrencia-bigint-staging-no-ejecutable-2026-11-10.md`.

## 1. Contrato incremental de staging (INC)
**Estado de partida histórico, no vuelto a consultar:** existen `public.clientes_oficiales`, `public.clientes_destinatarios` y `public.clientes_direcciones_entrega`; `clientes_oficiales.numero` y `cliente_numero` son `integer/int4`; IDs de destinatarios/direcciones `bigint/int8`; restricción `ed_cliente_cuba_direccion_ck` marcada `NOT VALID`. El borrador `staging_esquema_unico_v4_no_ejecutar.sql` abortaría si encuentra las tablas auxiliares existentes: **no reutilizar ni ejecutar**.

**Precondiciones INC-P01–P06:** identidad del proyecto staging y autorización nueva; inventario actualizado de tablas/columnas/defaults/secuencias; PK/FK/CHECK/índices y estado VALID; grants/RLS/propietarios/RPC; volumen y duplicados agregados sin PII; backup y ensayo de restauración autorizados. Cualquier valor desconocido = NO-GO.

**Contrato incremental propuesto:** diff declarativo por objeto (existente, faltante, distinto, incompatible); cambios aditivos y compatibles primero; no `DROP`, `TRUNCATE`, recreación ni cambio destructivo de PK; backfill idempotente y reversible solo si se aprueba posteriormente; `VALIDATE CONSTRAINT` por separado y tras diagnóstico; conciliación de secuencia y FKs sin reescribir IDs. El esquema de pedidos y sus snapshots es una fase futura independiente. La decisión de si mantener o ampliar el esquema se toma con evidencia nueva, no con el borrador v4.

**Aceptación INC-A01–A05:** A01 tipos exactos preservados; A02 no pérdida de clientes/direcciones; A03 constraint NOT VALID no se declara válida sin evidencia; A04 permisos no se amplían por defecto; A05 la migración es repetible y aborta sin efectos ante discrepancias.

## 2. Contrato de dirección única y operación atómica (DEDUP)
**Identidad lógica:** `cliente_numero + provincia + municipio + barrio + direccion` después de normalización definida y versionada. Mantener `referencias`, `nombre_receptor`, `telefono_receptor`, `usado_en` fuera de la clave para permitir actualización sin crear nueva dirección. No combinar apartamentos, casas o destinatarios diferentes por normalización excesiva.

**Decisión recomendada:** índice/constraint UNIQUE por identidad normalizada y RPC transaccional que compruebe sesión/propiedad, valide datos y haga un UPSERT atómico devolviendo ID estable. Normalización propuesta: Unicode NFC, trim y espacios repetidos; política de tildes y mayúsculas pendiente de prueba con direcciones cubanas reales ficticias. No activar una unicidad nueva sin auditar duplicados históricos y referencias. La alternativa de advisory lock solo sirve con transacción única y contrato de bloqueo verificable; mutex en Edge no garantiza concurrencia multiinstancia.

**Precondiciones DEDUP-P01–P05:** regla de normalización firmada; inventario de duplicados y referencias; estrategia de conservación de ID y snapshots; revisión de permisos RPC `SECURITY DEFINER` con `search_path` fijo y EXECUTE mínimo; plan de conflicto y observabilidad sin PII.

**Aceptación DEDUP-A01–A06:** A01 20 solicitudes paralelas del mismo cliente y dirección generan una identidad; A02 clientes distintos permanecen aislados; A03 variaciones normalizadas confluyen solo según contrato; A04 referencias/recipient no alteran clave; A05 reintentos y fallos no duplican; A06 ninguna consolidación borra referencias históricas. Las pruebas funcionales quedan pendientes de nueva autorización.

## 3. Contrato de serialización bigint (BIGINT)
**Decisión recomendada:** IDs `bigint/int8` de destinatarios y direcciones como **string decimal canónico** de extremo a extremo, con validación de `^[1-9][0-9]*$` y límite `9223372036854775807`. Nunca convertir IDs grandes a `Number`; usar `BigInt` únicamente para validar rango/comparación y volver a serializar string. Mantener `clientes_oficiales.numero integer/int4` como contrato distinto; no alterar PK existentes.

**Compatibilidad:** aceptar temporalmente números JSON solo si `Number.isSafeInteger` y son positivos; normalizarlos a string antes de comparar/filtrar. Rechazar números inseguros, exponentes, ceros iniciales y decimales en entradas string; preservar los IDs como strings en Edge, frontend, adaptador y persistencia. Contrato de salida único: string, con versión de API y migración de consumidores; evitar cambiar silenciosamente el tipo durante sesiones activas. El comportamiento exacto de PostgREST requiere prueba autorizada antes de implementar.

**Precondiciones BIGINT-P01–P04:** inventario de rutas y consumidores, serialización REST/RPC real, almacenamiento y comparación en UI, esquema de snapshots/historial. **Aceptación BIGINT-A01–A06:** A01 valores `1`, `9007199254740991`, `9007199254740992` y `9223372036854775807` se conservan; A02 se rechazan `0`, negativos, decimales y >int8; A03 no se mezclan IDs entre clientes; A04 búsqueda/actualización usa igualdad textual exacta; A05 adaptadores antiguos seguros siguen funcionando durante transición; A06 rollback de versión de API sin reescribir PK.

## 4. Dependencias, permisos, pruebas y reversión
| Orden | Entrega futura | Dependencia | Bloqueo |
|---|---|---|---|
| S00 | Preflight de metadatos staging | autorización específica | Estado real desconocido |
| S01 | Contrato normalización + ID | S00, decisión de compatibilidad | Duplicados y precisión no resueltos |
| S02 | Propuesta de migración incremental | S00–S01 | DDL destructivo o NOT VALID sin plan |
| S03 | Diseño RPC UPSERT + privilegios | S01–S02 | Acceso cruzado, UNIQUE ausente |
| S04 | Diseño adaptadores Edge/frontend | S01–S03 | Conversión Number insegura |
| S05 | Pruebas aisladas con datos ficticios | S02–S04 y autorización nueva | Carrera, pérdida de historial o rollback fallido |
| S06 | Cutover staging | S05 y autorización independiente | Servicios/correos/pedidos reales activos |

**Permisos:** `anon`/`authenticated` sin escritura directa; `service_role` no recibe grants adicionales por defecto; RPC privilegiada solo con comprobación de sesión, pertenencia, EXECUTE restringido y search_path fijo. Ningún test estático demuestra RLS efectivo ni atomicidad.

**Pruebas estáticas autorizadas ahora:** verificar referencias de código y borrador v4, 6+5+4 precondiciones, 5+6+6 aceptaciones, S00–S06, controles de permisos y checkout desactivado. **No se ejecutan pruebas SQL, concurrencia ni endpoints.**

**Reversión actual:** git revert de documentos y scripts estáticos. **Reversión futura:** backup/restore probado, rollback por fase con operaciones compensatorias, preservar PK, referencias, snapshots de pedidos y ledger; no eliminar registros ni alterar producción. **NO-GO** para toda operación fuera del alcance autorizado.
