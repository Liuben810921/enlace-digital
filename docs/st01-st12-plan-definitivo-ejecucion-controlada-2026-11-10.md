# ST-01–ST-12 — plan definitivo de validación integrada controlada (NO EJECUTAR)

Fecha: 2026-11-10. Base GitHub: `e711d2fc24c16eaeb1f64cd9ab96a81674cf46ae`; pruebas offline Deno `42920611880` y PostgreSQL desechable `42920611955`, ambas SUCCESS. Este documento es **preparación exclusiva en GitHub**. No constituye permiso para invocar RPC, leer filas, escribir en staging, desplegar, cambiar configuración ni activar servicios.

## 0. Alcance, segregación y estado inicial comprobado
- Staging administrativo: `enlace-digital-staging`, ref **`xqahthghvozeigbojhyi`**; producción distinta **`ubrvuplslconfxwpfzxj`**, excluida de todas las operaciones. Nunca utilizar identificadores de producción como parámetros.
- En ST-00 se inventariaron 8 tablas de aplicación con RLS habilitado, cero políticas y sin grants directos a `anon`/`authenticated`; 10 funciones, 8 `SECURITY DEFINER`; 0 Edge Functions desplegadas. ST-00B reconcilió el wrapper de registro y sus ACL. No inferir que un CI sintético demuestra comportamiento de staging.
- ST-00C modificó **solo un borrador GitHub**. No existe un endpoint Edge desplegado para ensayos HTTP. **Sin una autorización separada de despliegue limitado, las pruebas HTTP de ST-01/03/04/05/09/11/12 están BLOCKED; no sustituirlas por llamadas SQL privilegiadas equivalentes sin autorización expresa.**
- Los fixtures F6-B23–B30 de idempotencia son un **prototipo aislado**. No hay evidencia de que el contrato ED-OP-v1, la tabla de claves ni la recuperación de commit ambiguo estén integrados en el backend de clientes. ST-06/07/08 en staging están **BLOCKED hasta diseño e implementación autorizados**, no se simula aprobación.
- En el controlador, `verify_jwt=false` está propuesto para autenticación propia. La clave publicable no es autorización de usuario; la sesión del cliente debe validarse en cada operación privilegiada. El límite global de emergencia continúa compartido y es riesgo operativo.

## 1. Puertas de seguridad obligatorias (todas con evidencia y doble revisión)
| Puerta | Comprobación previa | Condición NO-GO |
|---|---|---|
| G0 Autorización | Permiso **independiente y explícito** para alcance exacto de escrituras ficticias, endpoints, duración, volumen, limpieza y responsable | Falta permiso o el permiso cubre solo lectura |
| G1 Entorno | Dos verificaciones independientes de ref staging `xqahthghvozeigbojhyi`, host `xqahthghvozeigbojhyi.supabase.co`, rama/commit, lista de migraciones y ausencia de cambios no autorizados | Ref/host no coinciden, o se descubre referencia a producción |
| G2 Efectos externos | Evidencia administrativa sin exponer secretos: correos salientes, recuperación real, pagos, webhooks, colas, pedidos y notificaciones **inactivos** o físicamente aislados. No basta con un booleano de la UI | Cualquier ruta puede enviar un correo, cobrar, crear pedido real o llamar tercero |
| G3 Datos | Aislamiento de fixtures por prefijo único; inventario previo de tablas/llaves relacionadas y respaldo/reversión aprobado. No leer ni reutilizar clientes/históricos | Datos de prueba indistinguibles de datos reales, sin rollback seguro |
| G4 Autenticación | Confirmar origen, configuración Auth/gateway y claves por **presencia/estado, no valor**; `service_role` solo servidor, sin endpoint público aún | Secrets expuestos, gateway no controlado o banderas no verificables |
| G5 Aislamiento | RLS/ACL revisados; acceso cruzado negativo solo entre identidades ficticias; nunca usar bypass RLS para certificar RLS | Privilegios no esperados, exposición a anon/authenticated |
| G6 Presupuesto | Máximo **2 clientes ficticios** en primera tanda, **2 destinatarios por cliente**, **2 direcciones por cliente**, **10 operaciones por caso**, **2 solicitudes simultáneas**, **15 minutos por tanda**. Reintentos máx. **3**, solo errores clasificados; detener ante 429 | Se supera límite, aparece 429 persistente o el tráfico no está aislado |
| G7 Evidencia | Identificador de ejecución, versión, resultados esperados/observados y comprobantes redactados sin PII ni tokens; aprobaciones por fase | Imposibilidad de auditar o de retirar fixtures |

**No realizar** lectura de filas de clientes reales, ni siquiera para medir antes/después; utilizar metadatos de catálogo, conteos agregados **solo si autorizados específicamente** y selectores exactos de fixtures previamente creados. No modificar roles/grants/RLS ni desactivar rate limiting para facilitar pruebas.

## 2. Fixtures ficticios propuestos (no crear hasta nueva autorización)
- ID de tanda: `ED-STAGE-YYYYMMDD-<nonce>`; `nonce` aleatorio de al menos 12 hexadecimales, generado **en ejecución futura** y registrado en manifiesto local cifrado o privado, no en logs públicos.
- Cliente A, Cuba: nombre `Prueba Staging Cuba`, teléfono ficticio reservado para pruebas **no enrutable y validado frente a reglas E.164 del sistema**; dirección `Calle Ficticia 100`, municipio `Plaza de la Revolución`, provincia `La Habana`. Correo omitido.
- Cliente B, extranjero: nombre `Prueba Staging Exterior`, teléfono ficticio distinto y validado; sin dirección habitual cubana; correo omitido.
- Destinatarios A1/A2 y B1/B2: nombres `Receptor Ficticio A1` etc.; teléfonos de prueba distintos, direcciones sintéticas en Cuba.
- **Bloqueo:** no se proporciona aquí ningún número telefónico que pudiera pertenecer a una persona real. Antes de crear cuentas, verificar que el entorno acepte un rango reservado o usar identificadores sintéticos inalcanzables con mecanismo de prueba aprobado; si la validación E.164 no lo permite, **NO-GO** hasta diseñar una vía de pruebas sin contactar terceros. No usar correo real, buzones de clientes, SMS, Zelle ni datos personales.
- Contraseñas/tokens: generar efímeramente en la futura ejecución; no registrarlos en GitHub, CI, issues, capturas ni informes. Solo hashes irreversibles para correlación, si autorizados.

## 3. Matriz ST-01 a ST-12 con dependencia y resultado exigido
| ID | Modalidad autorizable | Prueba | PASS verificable / bloqueo |
|---|---|---|---|
| ST-01 | Escritura ficticia + posible Edge | Registro A/B, login, token válido/inválido, logout y expiración | Sesión propia ligada al cliente; token revocado denegado. **BLOCKED** sin endpoint/permiso |
| ST-02 | Escritura ficticia/lectura de fixtures | ACL/RLS negativo entre A/B; anon/authenticated; supervisor solo si rol existe | Denegación de lectura/escritura cruzada; **no** usar service_role como prueba de RLS |
| ST-03 | Escritura ficticia + Edge | Cuba exige dirección; extranjero no; teléfono/nombre/apellido; duplicados | Rechazo antes de persistencia para inválidos; transacción atómica |
| ST-04 | Escritura ficticia; checkout dry-run separado | Dos destinatarios por cliente, cambios y aislamiento | IDs ligados a propietario; no snapshot de pedido hasta existir mecanismo de pedido ficticio aislado |
| ST-05 | Preferentemente offline; Edge solo tras permiso | JSON duplicado/escapado/anidado, Unicode, UTF-8, 4096 bytes, profundidad, errores | Rechazo 400/413 **antes de RPC**, ningún efecto; no afirmar ED-OP-v1 operativo |
| ST-06 | PostgreSQL desechable **únicamente por ahora** | NEW/REPLAY/CONFLICT por identidad/clave | PASS en fixtures F6-B23–B30; **BLOCKED en staging** sin integración idempotente autorizada |
| ST-07 | PostgreSQL desechable **únicamente por ahora** | Dos reintentos simultáneos por identidad | Un solo NEW y REPLAY coherente; staging **BLOCKED** |
| ST-08 | PostgreSQL desechable **únicamente por ahora** | Fallo antes/después COMMIT, rollback, cancelación y reconciliación | Evidencia F6-B26–B30; staging **BLOCKED** sin contrato operativo |
| ST-09 | Solo simulación/offline inicialmente | Cooldown, expiración, replay, revocación de correo sin envío | No enviar correo; DB solo con autorización y prueba de salida físicamente bloqueada |
| ST-10 | Offline/dry-run, sin pedidos reales | Entrega propia/tercero, stock, precios, cambios de destinatario | Ningún pedido real, pago ni reserva persistente; **BLOCKED** si no existe dry-run aislado |
| ST-11 | Metadatos/logs ficticios redactados | Revisar trazas de tanda y ausencia de PII/secretos | Solo IDs de fixture y estado; no consultar registros de clientes reales |
| ST-12 | Offline primero; staging bajo cuota | Errores RPC, límites por teléfono/global, cortes y cancelación | Fail-closed sin efecto duplicado; detener si 429 persistente o presión inesperada |

Los roles gestor, supervisor, admin general y principal **no** se crean ni se prueban en staging sin constatar su implementación y autorización específica. Las pruebas de recuperación de contraseña y pedidos no se mezclan con el registro de clientes.

## 4. Secuencia y reversión transaccional
1. **Fase P (ahora, GitHub):** revisión de plan, comprobador estático, CI y aprobación del protocolo. Cero acceso a staging.
2. **Fase R (autorización nueva, solo lectura):** confirmar G1–G5 mediante vías administrativas y documentación, sin leer filas ni secretos. Emitir informe PASS/BLOCKED.
3. **Fase W1 (autorización distinta, escrituras ficticias):** solo si G0–G7 PASS; iniciar por **una** transacción con fixture A y `ROLLBACK` si el procedimiento lo permite. En rutas HTTP que realizan su propio COMMIT, registrar previamente IDs y disponer de limpieza selectiva validada.
4. **Fase W2 (autorización distinta, pruebas integradas de mayor alcance):** ejecutar A/B y casos ST-01–05, 09, 11, 12 con cupos; no forzar ST-06–08 ni ST-10 si siguen BLOCKED.
5. **Fase C (dentro de permiso explícito de limpieza):** revocar solo sesiones ficticias, borrar exclusivamente registros marcados en manifiesto y sus dependencias en orden de FK; comprobar ausencia de fixtures con búsquedas exactas **solo sobre IDs creados**. Si la limpieza falla, parar, preservar evidencia y solicitar nueva autorización; nunca hacer DELETE masivo ni alterar datos reales.
6. **Fase D:** actualizar matriz por caso con PASS/FAIL/BLOCKED/NOT RUN y evidencia CI; mantener NO-GO hasta resolución de bloqueantes.

**Reversión:** para pruebas en transacción usar `ROLLBACK`; para registros persistentes, limpieza selectiva preaprobada con claves exactas y validación de dependencias. No hacer `TRUNCATE`, `DROP`, migraciones, reinicios ni cambios de configuración. No prometer restauración desde backup sin constancia administrativa y procedimiento ensayado. La reversión de GitHub es `git revert` del commit correspondiente, sin tocar Supabase.

## 5. Interruptores de detención inmediata
Abortar y documentar ante proyecto/host inesperado, error de autorización, consulta a datos reales, fuga de secretos, correo/SMS/pago/pedido/webhook, bloqueo compartido persistente, consumo de cuota, pérdida de aislamiento, fallo de limpieza, cambios de esquema no previstos o cualquier 5xx reiterado. No desactivar controles para conseguir PASS.

## 6. Plantilla de evidencia por caso
`run_id | ST-ID | commit | project_ref | permiso_específico | precondiciones G0-G7 | fixture_ids | resultado_esperado | observado_sin_PII | PASS/FAIL/BLOCKED/NOT RUN | rollback_verificado | riesgos | responsable`

La publicación en GitHub debe usar **solo referencias ficticias redactadas**, sin tokens, números de teléfono, contraseñas, correos, direcciones completas, cabeceras de autorización ni valores de variables.

## 7. Decisión de cierre
- **GO únicamente para la siguiente fase autorizada** cuando G0–G7 PASS y la fase no exige despliegue/servicios no autorizados.
- **NO-GO para despliegue, activación pública, correos, pagos y pedidos reales** hasta pruebas integradas satisfactorias, revisión de seguridad, autorización de cambios y aprobación comercial posterior.
- **Estado actual:** PLAN DEFINITIVO PREPARADO; ST-01–ST-12 **NO EJECUTADOS en staging**. Solo pruebas offline de GitHub completadas. Ninguna autorización se transmite implícitamente entre fases.
