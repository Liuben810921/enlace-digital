# F4 — Adaptadores ID-STRING-v1 para RPC, Edge y frontend (NO EJECUTABLE)

Fecha: 2026-11-10. Base: `977a67f41b985cf24b3d325ead54d3892cc795eb`. Solo documentación y pruebas offline; sin modificar controlador, adaptador operativo, Supabase ni producción. GitHub Actions #430: job static success, incluida F3.

## Inventario de consumidores existentes
- Base F0: `clientes_oficiales.numero int4` y `cliente_numero int4` en hijas; `clientes_destinatarios.id int8`, `clientes_direcciones_entrega.id int8`.
- Edge staging `supabase/functions/enlace-cliente-auth-staging/index.ts`: `validId` requiere `Number.isSafeInteger`; `recipient-save` valida `body.id` como número; `delivery-location-save` consulta `id` directamente con PostgREST; `profile` retorna listas `destinatarios` y `direcciones_entrega` sin convertir IDs.
- `scripts/staging_customer_web_adapter.mjs`: transporta `JSON.stringify({action,...data})` y `response.json()` sin transformación de IDs. El transporte solo acepta endpoint staging y clave pública; no es importado por producción según su comentario. La mera existencia de adaptador no implica despliegue.
- `tests/staging_customer_web_adapter_test.mjs`: mocks de transporte sin red. Se debe conservar su aislamiento.

## Contrato normativo de frontera ID-STRING-v1
**Tipos:** `recipient_id` y `delivery_location_id` siempre cadenas JSON decimales canónicas `^[1-9][0-9]*$` con máximo `9223372036854775807`. `cliente_numero` permanece número JSON entero positivo `<=2147483647`. `null` solo para ausencia explícita de ID al crear; no equivale a "0".

**RPC/PostgreSQL (futuro):** emitir `id::text` desde origen en todas las respuestas, incluyendo `profile`, `recipient-save` y `delivery-location-save`. No depender de cómo PostgREST serialice int8. Para filtros, el ID entrante se valida como cadena canónica antes de convertirlo al tipo bigint en el servidor; siempre se comprueba `cliente_numero` obtenido de sesión. La RPC F3 debe devolver `{id: "decimal", reused: boolean, norm_version: "NORM-v1"}`.

**Edge (futuro):** validar strings con regex, límite de 19 dígitos y `BigInt` hasta máximo int8, sin `Number` intermedio. Compatibilidad de entrada: números JSON solo si `Number.isSafeInteger` y >0, convirtiendo a string antes de la consulta. **Rechazar** números JSON inseguros aunque el valor aparente ser entero: la precisión ya puede haberse perdido. Respuestas ID-STRING-v1 solo con strings; no devolver `BigInt` crudo a `JSON.stringify`. No registrar IDs de clientes asociados a tokens ni datos personales en logs.

**Frontend (futuro):** tratar IDs de destinatario y ubicación como cadenas opacas; conservarlas en estado, formularios y referencias, no hacer `parseInt`, `Number`, operaciones aritméticas ni ordenación numérica de IDs. Comparar strings canónicas. Enviar string a `recipient-save` y recibir string de `delivery-location-save` y `profile`. Versionar adaptador para clientes antiguos: aceptar number seguro solo al ingreso; clientes que requieran respuesta number deben quedarse en versión anterior bajo umbral seguro o recibir error explícito de incompatibilidad. Nunca degradar un ID grande a number.

**Seguridad:** token y sesión siguen siendo la autoridad; `cliente_numero` no es controlado por el navegador; filtro de `id` junto con propietario; RLS y permisos mínimos intactos; feature flags de staging OFF. Rechazar valores `"01"`, `"0"`, `"-1"`, `"1e3"`, `" 1"`, `"9223372036854775808"`, fracciones, arrays, objetos, booleanos y `null` fuera de creación.

## Matriz de compatibilidad
| Consumidor | Estado actual | Adaptación futura | Riesgo |
|---|---|---|---|
| `recipient-save` | `body.id` number seguro; salida number | Entrada string, salida string; compatibilidad number seguro solo entrada | Rechazo de clientes viejos |
| `delivery-location-save` | SELECT→INSERT/UPDATE y `id` number | RPC atómica F3 + respuesta `id` string | Carrera y pérdida de precisión |
| `profile` | IDs sin transformación | RPC/proyección `id::text` para listas | JSON numérico inseguro |
| `session`/`login`/`register` | `cliente.numero` int4 | Mantener número int4, validar rango | Mezclar tipos de ID |
| Adaptador web | JSON sin mapeo | Adaptador versionado que valida respuestas y envía strings | Coerción silenciosa |
| Pedidos históricos | snapshots de destinatario | Conservar referencias y copias históricas sin reescritura de IDs | Pérdida de historial |

## Casos de aceptación F4 (offline contract; funcionales pendientes)
| Caso | Resultado exigido |
|---|---|
| B01 | `"1"` ID string válido |
| B02 | `"9007199254740991"` ID string válido |
| B03 | `"9007199254740992"` ID string válido |
| B04 | `"9223372036854775807"` ID string válido |
| B05 | `"9223372036854775808"` rechazado |
| B06 | `"01"` rechazado |
| B07 | `"1e3"` rechazado |
| B08 | `"-1"` rechazado |
| B09 | JSON number 1 aceptado transitoriamente en entrada |
| B10 | JSON number 9007199254740992 rechazado |
| B11 | `null` rechazado salvo ausencia explícita en creación |
| B12 | `profile` devuelve todos los IDs int8 como strings |
| B13 | `recipient-save` filtra por cliente autenticado |
| B14 | `delivery-location-save` usa RPC atómica y devuelve string |
| B15 | `cliente_numero` sigue int4 numérico |
| B16 | `JSON.stringify` no recibe BigInt crudo |
| B17 | Un ID no puede dar acceso a otro cliente |
| B18 | Cliente antiguo no recibe un número redondeado |
| B19 | No hay cambios en permisos RLS, grants ni secrets |
| B20 | Feature flags OFF, checkout real OFF, reversión segura |

## Dependencias, NO-GO y reversión
1. Aprobar por separado la migración F2 y la RPC F3; no implementar adaptadores contra contrato SQL inexistente.
2. Probar con mocks y luego staging autorizado que `id::text` sale como JSON string exacto incluso para ID > 2^53. Probar serialización, filtros, reintentos, autorización cruzada y paginación.
3. Mantener versión anterior para IDs seguros; si no hay garantía de precisión, **fail-closed** y no habilitar escritura.
4. Reversión F4 documental: `git revert` de documentos y validadores. Reversión futura: feature flag OFF, mantener compatibilidad de API, no convertir IDs ni modificar PK/FK; si el flujo viejo no es seguro, bloquear escrituras en vez de volver a SELECT→INSERT inseguro.
5. **NO-GO:** PostgREST devuelve int8 como number sin proyección a texto; pérdida de precisión, grants ampliados, cliente cruzado, incompatibilidad de frontend o rollback no probado.

**Limitación:** los casos B01–B11 pueden validarse con ejemplos offline; B12–B20 son criterios documentales hasta que haya código operativo y staging autorizados. No declarar comportamiento real probado.
