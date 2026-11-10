# F3 — Diseño de RPC transaccional de direcciones (NO EJECUTABLE)

Fecha: 2026-11-10. Base: `ae78056e2bcbbcef9c34a7d781a6f9b358304ac3`. Diseño offline, sin SQL ejecutable, consultas a Supabase, modificación de controlador, despliegue o producción.

## Dependencias y límites
- F0: `clientes_direcciones_entrega.id int8`, `cliente_numero int4`, RLS habilitado, índice cliente no único, `service_role` con DML en hijas; no hay UNIQUE por dirección. `clientes_oficiales` no permite DML directo a `service_role`.
- F1: `NORM-v1` (NFC + colapso Unicode White_Space, comparación exacta de bytes, sin lower/transliteración) y `ID-STRING-v1` (IDs bigint JSON string exactos).
- F2: antes de esta RPC deben estar aprobados y aplicados por separado backfill, resolución manual de colisiones históricas, restricción UNIQUE por cliente+versión+clave normalizada, y respaldo/restauración ensayados. **NO-GO si falta UNIQUE**.
- El controlador staging actual usa SELECT y luego UPDATE/INSERT; no es atómico. Este documento no lo cambia.

## Contrato propuesto RPC-DIR-v1
**Nombre provisional:** `ed_cliente_ubicacion_guardar_v1_privada`; nombre y firma definitivos requieren revisión F4/F5. Invocación exclusivamente desde Edge staging con credencial `service_role` protegida en servidor; el cliente web nunca recibe esa credencial. Entrada: hash de token de sesión (64 hex), provincia, municipio, barrio opcional, dirección, nombre receptor, teléfono receptor, referencias; no aceptar `cliente_numero`, `id` ni identidad normalizada del cliente como autoridad. La RPC resuelve `cliente_numero` desde sesión válida no revocada ni caducada en la misma transacción; aplica límites y validación NORM-v1 del lado servidor.

**Salida:** `{id: "decimal-int8", reused: boolean, norm_version: "NORM-v1"}`. El ID debe convertirse a texto en el origen SQL/RPC antes de JSON/PostgREST; jamás `Number(id)` o conversión tardía de un número ya redondeado. Errores genéricos para el usuario; detalles técnicos sin tokens, PII ni secretos en logs. No afirmar que el RPC existe o está desplegado.

## Algoritmo conceptual — NO es SQL ni código operativo
1. Comprobar identidad del proyecto y flag staging, validar sesión y tasa por cliente en Edge; la RPC **revalida sesión** dentro de su propia transacción y deriva cliente exclusivamente del token, sin confiar en `cliente_numero` del cuerpo.
2. Normalizar y validar en el servidor con única implementación NORM-v1; generar clave canónica no ambigua que incluya `cliente_numero`, versión, provincia, municipio, barrio y dirección. Prohibir NULL ambiguos; barrio vacío = `""`. Mantener campos no clave fuera de la identidad.
3. Efectuar una única operación transaccional de INSERT ... ON CONFLICT respaldada por UNIQUE válido. En conflicto, obtener el ID de la misma fila y del mismo cliente, sin leer/actualizar filas de terceros. Nunca usar SELECT→INSERT separado como mecanismo de deduplicación.
4. Política **no sobrescribir receptor**: si se reutiliza la ubicación, no actualizar automáticamente `nombre_receptor`, `telefono_receptor` ni `referencias` preexistentes. El destinatario concreto y su teléfono deben almacenarse en la entidad de destinatario o snapshot inmutable del pedido; no asumir que reutilizar ubicación equivale a editar destinatario.
5. Devolver ID como cadena decimal exacta y `reused`. En reintentos, misma identidad de cliente retorna mismo ID. Evitar dependencia de orden entre peticiones concurrentes; `reused` puede depender de cuál ganó el INSERT.
6. Rechazar si no existe UNIQUE, si la versión de normalización difiere, si hay drift, si faltan grants mínimos o si se detecta cualquier inconsistencia; fail-closed.

## Seguridad y permisos
- `SECURITY DEFINER` solo si la revisión demuestra necesidad, owner restringido, `SET search_path = ''` o esquema fijo sin objetos manipulables; calificar todas las referencias de objetos. Revisar resolución de funciones auxiliares, tablas temporales y posibles inyecciones.
- `REVOKE EXECUTE FROM PUBLIC, anon, authenticated`; `GRANT EXECUTE TO service_role` exclusivamente tras aprobación y revisión de dependencias. No conceder SELECT/INSERT/UPDATE directo a clientes.
- Validar token de sesión mediante hash; no registrar token ni contraseñas. Verificar revocación y expiración en la misma transacción; no aceptar `cliente_numero` ni `id` suministrado para decidir ownership.
- Límite de solicitudes por cuenta y global; transacción corta; sin bloquear otras cuentas. Aislamiento lógico por cliente+clave; índice UNIQUE es el árbitro de concurrencia.
- `ON CONFLICT DO UPDATE` puede producir efectos laterales (triggers, timestamps, permisos UPDATE, bloqueo de fila). La elección entre DO UPDATE mínimo y mecanismo alternativo debe revisarse y ensayarse; no actualizar campos de receptor ni logística inadvertidamente.
- No relajar RLS, no alterar funciones existentes sin pruebas; revisar permisos efectivos de funciones `SECURITY DEFINER` y `service_role`.

## Matriz de pruebas F3 — futuras, no ejecutadas
| Caso | Criterio de aceptación |
|---|---|
| T01 | Token válido permite guardar dirección propia |
| T02 | Token expirado o revocado rechaza |
| T03 | Token inválido o mal formado rechaza |
| T04 | Cliente A no puede consultar ni alterar ubicación de B |
| T05 | `cliente_numero` falsificado en petición no cambia ownership |
| T06 | 20 solicitudes simultáneas del mismo cliente/ubicación devuelven un solo ID |
| T07 | 20 solicitudes de clientes distintos no se mezclan |
| T08 | Reintento idempotente devuelve mismo ID |
| T09 | Unicode NFC y White_Space equivalentes reutilizan ID |
| T10 | Tildes, mayúsculas y apartamentos distintos no colisionan |
| T11 | `reused` informa creación/reutilización sin asumir orden |
| T12 | Reutilizar dirección no sobrescribe receptor/teléfono/referencias |
| T13 | ID > 9007199254740991 se devuelve como string exacto |
| T14 | ID int8 máximo 9223372036854775807 no pierde precisión |
| T15 | UNIQUE ausente o inválido provoca NO-GO |
| T16 | No hay grants directos a anon/authenticated ni EXECUTE público |
| T17 | Rollback conserva direcciones, FK, snapshots e IDs |
| T18 | Errores y logs no exponen token, PII ni secretos |
| T19 | Reintentos bajo contención no producen duplicados ni deadlocks persistentes |
| T20 | Flags de staging OFF y checkout real desactivado hasta aprobación |

## Compatibilidad con Edge/frontend
`delivery-location-save` mantendría su nombre público y validación, pero en fase futura reemplazaría SELECT→INSERT/UPDATE por una única llamada RPC. Versionar respuesta `id` string; adaptar frontend a `ID-STRING-v1`, aceptando transitoriamente JSON number solo si `Number.isSafeInteger`. `recipient-save` y `profile` necesitan adaptación F4 independiente. No cambiar endpoints ni rutas en F3.

## Reversión y criterios NO-GO
- Esta fase F3: `git revert` de documentos y validadores estáticos; no hay cambios en Supabase.
- Futura activación: feature flag OFF para volver al flujo anterior solo si se prueba seguro; si el flujo anterior puede duplicar, mantener escrituras bloqueadas hasta reparación. Conservar UNIQUE e IDs mientras existan dependencias; no DROP automático. Backup restaurable, rollback ensayado y autorización explícita.
- NO-GO: falta de UNIQUE, duplicados históricos pendientes, permisos ampliados, sesión sin revalidación, normalización divergente, pérdida de bigint, sobrescritura de receptor, falla de concurrencia o rollback no ensayado.
- Pruebas documentales no demuestran atomicidad real; requieren ensayo autorizado sobre staging con datos ficticios y controles de aislamiento.
