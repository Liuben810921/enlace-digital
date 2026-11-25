# Contrato de API de pedidos oficiales — diseño NO ejecutable

Versión: 2026-11-09 / base `06044f5c22ae21367d5063add82f0640d82971fd`.
**Estado: propuesta offline, no autorizada para despliegue.** Este documento no habilita pedidos, no contiene secretos y no autoriza SQL, llamadas HTTP ni cambios en Supabase. `ED_REAL_CHECKOUT_ENABLED=false` sigue vigente.

## Frontera y autenticación

Una futura Edge Function `enlace-pedidos-staging` (nombre propuesto, NO creada) expondría exclusivamente HTTPS POST con `action`, validación de origen permitido y sesión de cliente oficial para creación/lectura propia, o JWT de Supabase Auth para funciones administrativas. Las sesiones de clientes oficiales **no** son JWT administrativos y jamás deben aceptar un `cliente_numero` suministrado como autoridad. Verificar firma/validez, caducidad, revocación y vinculación de sesión en backend. No usar la clave pública como prueba de identidad. No exponer `service_role` en navegador ni aceptar un rol declarado en el body. El backend verifica rol habilitado en `departamentos_admins` y aplica capacidades por acción; las lecturas de datos personales deben minimizarse y paginarse.

### Matriz propuesta, pendiente de aprobación de negocio y políticas DB

| Acción | Cliente | Principal | General | Operativo | Supervisor | Anónimo |
|---|---|---|---|---|---|---|
| create-order | Propia | No por rol; solo con sesión de cliente | Igual | Igual | Igual | Denegado |
| get-own-order / list-own-orders | Solo propias | Igual | Igual | Igual | Igual | Denegado |
| list-admin-orders / get-admin-order | No | Sí | Sí | Solo asignados si se aprueba asignación | Solo lectura autorizada | No |
| transition-order | No | Sí | Sí | Solo estados y pedidos asignados expresamente | No | No |
| verify-payment | No | Sí | Sí con permiso explícito | No salvo aprobación separada | No | No |
| cancel-own-order | Solo si política futura lo permite, no implementada | N/A | N/A | N/A | N/A | No |

No hay permisos administrativos implícitos por ser cliente ni viceversa. Supervisor jamás muta pedidos, pagos ni inventario. `principal`, `general`, `operativo` y `supervisor` son identificadores observados en la UI; la política efectiva en servidor queda pendiente. Prohibir lectura REST directa a tablas de pedidos por roles de navegador; usar RPC/vista segura de administración.

## Endpoints lógicos y contratos JSON propuestos (NO desplegados)

`POST {action:"create-order", session_token:"<opaque>", idempotency_key:"<uuid>", recipient_id:123|null, delivery_location_id:456|null, delivery:{nombre,telefono,provincia,municipio,barrio,calle_detalle,referencias}, items:[{producto_id:123,variante_color:"azul"|null,cantidad:1}], pago_metodo:"efectivo_cup"|"efectivo_usd"|"zelle"}`

La API deriva `cliente_numero` de la sesión; los IDs de destinatario y dirección deben pertenecer al cliente y las copias se generan en servidor. Si se permite editar destinatario durante checkout, el servidor valida y congela los datos finales; nunca toma IDs ajenos. El navegador no transmite `precio_unitario_usd`, `total_usd`, `estado`, `origen_producto` ni `stock` como autoridad. Se define máximo de líneas/cantidades/tamaño de body y validación estricta de campos.

`201 {pedido_id,estado:"pendiente",moneda:"USD",subtotal_usd:"120.00",total_usd:"120.00",mensajeria_cup:"500.00"|null,idempotency_key}`; replay idéntico: `200` con mismo ID y snapshot. Misma clave con payload diferente: `409 IDEMPOTENCY_CONFLICT`. Las cantidades monetarias viajan como **cadenas decimales**, no floats JS. No retornar PII innecesaria.

`POST {action:"get-own-order",session_token,pedido_id}` / `list-own-orders`: autorización de propietario en servidor, paginación con cursor estable, snapshot congelado y eventos permitidos; sin pedidos ajenos.

`POST {action:"list-admin-orders",admin_jwt,filters,cursor,limit}` y `get-admin-order`: verificar JWT y `departamentos_admins` por usuario, `enabled=true`, rol y alcance; datos mínimos; no depender del `edAdminAuthorized` del HTML. La pantalla actual usa `/rest/v1/pedidos_oficiales`: requiere adaptación futura autorizada a endpoint seguro o vista con RLS; el contrato no cambia la tienda.

`POST {action:"transition-order",admin_jwt,pedido_id,expected_version,to_estado,motivo}`: compare-and-swap por versión, validación de transición, evento append-only y actualización atómica de proyección `estado`. Ejemplo de estados propuestos: `pendiente → confirmado → preparando → en_camino → entregado`; `cancelado` solo desde estados permitidos según política. No permitir volver desde entregado/cancelado. Eventos incluyen actor, timestamp y motivo; pagos se gestionan separadamente.

`POST {action:"verify-payment",admin_jwt,pedido_id,expected_version,decision}`: rol/capacidad explícitos, registro auditable independiente; nunca registrar números de tarjetas, contraseñas ni secretos Zelle.

## Invariantes de precios, inventario y transacción

1. Leer `public.productos` por ID numérico; validar `archivado=false`, `disponible=true`, variante de color y cantidad. Recalcular precio USD del catálogo **dentro de transacción**. `numeric(14,2)`, importe por línea = precio × cantidad; subtotal = suma de líneas. `total_usd` no incluye mensajería CUP. Capturar tipo de cambio aplicable y política de promociones del servidor, no del navegador.
2. Para `origen_producto='propio'`: bloqueo de filas en orden determinista para evitar deadlocks; verificar cantidad global o por variante según estructura autoritativa; descontar/reservar exactamente una vez; evitar stock negativo. Definir y aprobar cuándo se libera reserva al cancelar.
3. Para `origen_producto='proveedor'`: `cantidad=0` no significa sin disponibilidad ni inventario ilimitado. Validar `disponible` y variante, pero **no descontar** stock ficticio. La transición a confirmado depende de verificación de disponibilidad con proveedor; si no se puede confirmar, mantener pendiente o rechazar conforme política futura.
4. Una transacción DB atómica crea cabecera, líneas, snapshot de dirección, evento inicial y ajustes de stock propio. Clave idempotente única por cliente/intento, con huella de payload canónico; bloqueo/índice único resuelve carreras. Si cualquier línea falla, rollback completo, salvo avance no transaccional de secuencias. No reservar stock en Edge fuera de transacción DB.
5. Guardar snapshot inmutable de destinatario, dirección completa `entrega_direccion`, detalle de calle, productos, precios y pago pactado. Los eventos de estado son append-only; `estado` de cabecera es proyección controlada. Actualizaciones/borrados de snapshot prohibidos por ACL y mecanismos DB. Definir retención y minimización de PII.

## Errores HTTP y fail-closed

| HTTP | Código | Condición |
|---|---|---|
| 400 | VALIDATION_ERROR | Campos, cantidades, color o formato inválidos |
| 401 | UNAUTHENTICATED | Sesión/JWT ausente, caducado o revocado |
| 403 | FORBIDDEN | Cliente ajeno o rol/capacidad insuficiente |
| 404 | NOT_FOUND | Pedido/producto no visible; evitar enumeración |
| 409 | IDEMPOTENCY_CONFLICT | Misma clave con distinto payload |
| 409 | VERSION_CONFLICT | Cambio concurrente de estado |
| 409 | OUT_OF_STOCK | Stock propio insuficiente |
| 409 | PRODUCT_UNAVAILABLE | Archivado/no disponible/variante inválida |
| 422 | SUPPLIER_UNCONFIRMED | Requiere confirmación de proveedor (política por definir) |
| 429 | RATE_LIMITED | Límite por identidad/operación |
| 500 | INTERNAL_ERROR | Fallo interno; sin detalles de DB ni secretos |
| 503 | ORDERS_DISABLED | Flag de pedidos apagado; **comportamiento obligatorio hoy** |

Errores estructurados `{error:{code,message,request_id}}`, sin PII, trazas SQL ni tokens. Reintentos seguros solo con la misma idempotency key y mismo payload; no reenviar pagos/cobros. CORS restringido y rate limiting por sesión/IP, sin usar IP como única identidad.

## Seguridad, despliegue futuro y reversión (NO AUTORIZADOS)

Falta implementar DDL/RLS/grants mínimos, funciones SECURITY DEFINER con search_path fijo, auditoría de roles, política de stock y pruebas de concurrencia. Las propuestas SQL siguen comentadas. El controlador Edge de autenticación staging no crea pedidos. El HTML mantiene `ED_REAL_CHECKOUT_ENABLED=false` y la ruta de clientes existente difiere del nombre de Edge staging auditada; resolver en fase futura.

Antes de cualquier despliegue: respaldo y snapshot de ACL, revisión de consumidores, pruebas offline, pruebas SQL ficticias aisladas autorizadas, despliegue staging separado, pruebas HTTP con servicios desactivados por defecto y aprobación específica para cada activación. Reversión: apagar flags, revertir versión Edge/UI, conservar pedidos y eventos ya creados, compensar stock solo mediante operación auditada; **nunca borrar historial ni reiniciar secuencias automáticamente**. Prohibido tocar producción sin autorización independiente.

## Criterios de aceptación para la futura implementación

- Cliente A no puede leer/crear en nombre de B; supervisor no puede mutar; admin general solo según capacidades; anon denegado.
- Doble solicitud concurrente con misma clave crea un pedido y descuenta stock una vez; distinta huella devuelve 409.
- Precio y stock alterados entre vista previa y confirmación: se recalculan o rechaza, nunca se acepta precio antiguo sin autorización.
- Producto propio con cantidad/color insuficiente falla sin filas ni reservas residuales; proveedor no sufre descuento ficticio.
- Error de ítem revierte transacción; cambios de estado/versiones generan eventos coherentes; cancelación respeta política.
- Editar destinatario/catálogo no altera snapshot histórico; mensajería CUP separada de productos USD.
- Con `ED_REAL_CHECKOUT_ENABLED=false` o función desactivada, **no se crea pedido**.
- No hay correos, cobros, servicios ni pedidos reales durante pruebas.

**Decisión actual: NO-GO para implementación o activación.**
