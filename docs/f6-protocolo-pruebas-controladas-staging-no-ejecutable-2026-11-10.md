# F6 — Protocolo de pruebas controladas en Supabase staging (NO EJECUTABLE)

Fecha: 2026-11-10. Base F5 `c56d0028e6a3ffe59b2dc4ea8fc4d15b63e1bf10`. CI #438: job static success. **Documento de preparación, no autorización para consultar o modificar Supabase.** No contiene instrucciones SQL listas para ejecutar. No cambia servicios, secretos, funciones, frontend ni producción.

## Alcance y puertas de autorización
**Proyecto permitido en una fase futura:** `enlace-digital-staging` (ID `xqahthghvozeigbojhyi`). Proyecto de producción fuera de alcance. F0 fue una observación histórica de metadatos, no garantía de estado actual. Cualquier operación futura necesita nueva autorización explícita, con separación:
- **F6-A, solo lectura de metadatos:** comprobar identidad, tipos, índices, constraints, RLS, grants, funciones, owners y dependencias. No leer filas de clientes ni PII.
- **F6-B, solo lectura agregada:** únicamente si se autoriza aparte, contar grupos de direcciones potencialmente duplicadas sin devolver direcciones, nombres, teléfonos, IDs o tokens. Los conteos pequeños pueden ser sensibles: registrar solo métricas necesarias, sin exportar datos.
- **F6-C, pruebas de escritura aisladas:** requiere autorización independiente, plan de datos ficticios, verificación de respaldo y limpieza segura. **NO se puede ejecutar mientras no existan migración F2, UNIQUE y RPC F3 autorizadas, implementadas y verificadas.**
- **F6-D, cambios de esquema o despliegue:** fuera de esta autorización; requiere aprobación distinta por objeto y operación. Ningún pedido real, correo ni servicio se activa.

## Preflight fail-closed (antes de cualquier futura prueba)
| Control | Evidencia exigida |
|---|---|
| P01 | Confirmación explícita de proyecto staging y credenciales de alcance mínimo; sin revelar secretos |
| P02 | Estado de backups, capacidad de restauración y aprobación de ventana; si no hay respaldo viable, NO-GO escritura |
| P03 | Inventario actualizado de tablas, columnas, PK, FK, índices, secuencias y dependencias; comparar con F0 |
| P04 | RLS habilitado y grants sin ampliación a anon/authenticated |
| P05 | Revisar SECURITY DEFINER/INVOKER, search_path, owner y EXECUTE mínimo de RPC |
| P06 | Confirmar `ed_cliente_cuba_direccion_ck NOT VALID` o documentar drift; no validar automáticamente |
| P07 | Confirmar migración F2 aplicada y UNIQUE válido, sin duplicados pendientes, antes de probar RPC |
| P08 | Confirmar RPC F3 realmente instalada, contrato NORM-v1 y proyección `id::text` |
| P09 | Confirmar feature flags OFF, correo y pedidos reales desactivados |
| P10 | Datos sintéticos identificables, sin colisión con clientes existentes; aislamiento y limpieza definidos |
| P11 | Límites de carga y concurrencia aprobados; sin afectar cuotas gratuitas ni tráfico real |
| P12 | Plan de reversión, métricas de parada y responsables autorizados |

## Matriz de ensayos futuros (no ejecutados)
| Prueba | Método controlado | Aceptación / evidencia |
|---|---|---|
| T01 | Metadatos sin filas | Identidad staging y esquema coinciden con baseline o drift aprobado |
| T02 | Revisión de RLS/grants | anon/authenticated sin nuevos permisos directos; RPC solo service_role |
| T03 | Revisión de sesiones | Token válido, expirado, revocado y mal formado: respuestas correctas, sin exponer hashes |
| T04 | Aislamiento entre clientes ficticios | Cliente A no consulta, edita ni reutiliza direcciones de B |
| T05 | Concurrencia 20 solicitudes misma ubicación/cliente | Un solo ID exacto y una fila, sin deadlocks persistentes |
| T06 | Concurrencia entre dos clientes | Dos espacios de identidad separados |
| T07 | NORM-v1 Unicode | NFC, White_Space equivalentes; tildes, mayúsculas y apartamentos distintos |
| T08 | Receptor y snapshots | Reutilizar dirección no sobrescribe receptor/teléfono ni historial |
| T09 | ID-STRING-v1 límites | `9007199254740992` y `9223372036854775807` como strings, nunca JSON number |
| T10 | Rechazo de IDs inválidos | `01`, exponentes, negativos, fuera de int8 y JSON number inseguro rechazados |
| T11 | Reintentos y rate limiting | Idempotencia, límites y respuestas genéricas sin fuga de PII |
| T12 | Rollback de prueba | Reversión ensayada y datos ficticios limpiados sin tocar clientes reales |
| T13 | Duplicados históricos agregados | Cero conflictos pendientes antes de UNIQUE; si existen, detener sin fusionar |
| T14 | Compatibilidad Edge/frontend | Contratos versionados y rechazo seguro de clientes antiguos incompatibles |
| T15 | Auditoría de seguridad | No logs con secretos, tokens, teléfonos, direcciones ni credenciales |
| T16 | Estado comercial | Pedidos reales y correos permanecen desactivados; producción intacta |

## Orden y gestión de riesgos
1. Obtener autorización específica F6-A y registrar alcance de lectura. Comprobar solo metadatos. Detener si hay drift.
2. Solicitar F6-B **separadamente** si hace falta detectar duplicados históricos. Nunca revelar grupos identificables.
3. Si falta UNIQUE, RPC o adaptador, **NO-GO para T03–T12**: no simular resultados como si fueran pruebas de staging. Preparar cambios y pedir autorización por separado.
4. Antes de F6-C, definir dos clientes ficticios aislados, tokens efímeros, TTL, cuotas, ruta de limpieza y rollback; probar con carga pequeña antes de 20 concurrencias.
5. Recoger solo estado PASS/FAIL, SHA de versión, fecha, entorno y conteos no identificables. No almacenar datos personales en GitHub.
6. Ante cualquier fallo, detener pruebas de escritura, desactivar ruta experimental, preservar evidencias no sensibles y no tocar datos históricos.

## NO-GO
Proyecto incorrecto; drift no aprobado; backup no restaurable; duplicados pendientes; UNIQUE ausente o inválido; RPC F3 no instalada; RLS o grants ampliados; precisión bigint incierta; sesiones sin aislamiento; ausencia de plan de limpieza; cuota gratuita amenazada; correos/pedidos reales activos; riesgo de tocar producción.

## Reversión
**F6 actual:** `git revert` del documento, validador y workflow. No hay DDL/DML, filas nuevas ni despliegue. **Futura F6-C:** feature flag OFF y bloqueo de escrituras experimentales; revertir únicamente datos ficticios por identificadores auditados tras comprobar dependencias; no DELETE masivo, no reset de secuencias, no restaurar backup sobre datos de clientes existentes sin autorización y ensayo.

## Estado de evidencia
F5 simuló concurrencia mediante candado Python; eso **no valida PostgreSQL ON CONFLICT, RLS, PostgREST, sesiones ni reversión real**. F6 solo documenta cómo obtener evidencia futura de forma controlada. Todas T01–T16 quedan **PENDIENTES DE STAGING**.
