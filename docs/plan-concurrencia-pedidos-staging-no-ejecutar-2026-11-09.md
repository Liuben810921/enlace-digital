# Plan reproducible de concurrencia e integridad de pedidos — solo offline

Base `2c0ef99c612b231b62e9d08bd41103ffa3ca1061`. Referencia: `sql/propuestas/staging_pedidos_transacciones_concurrencia_no_ejecutar.sql`, **100 % comentarios, no ejecutable**. Este plan no crea funciones, no conecta con Supabase y no activa pedidos.

## Contrato transaccional
`ed_pedido_crear_privado`: sesión oficial válida; cliente derivado de sesión; destinatario/dirección propios; clave de idempotencia `UNIQUE(cliente_numero,idempotency_key)` y hash canónico de payload. Al existir una clave, bloquear/reconciliar el registro: mismo hash devuelve mismo ID, hash distinto error `IDEMPOTENCY_CONFLICT`. La reserva de stock, cabecera, ítems, snapshot y primer evento ocurren en **una única transacción de PostgreSQL**; nunca realizar reserva en Edge por separado. Evitar acciones externas antes del commit.

Catálogo: ordenar y bloquear filas `productos` por ID numérico; leer precios USD y disponibilidad actualizados, usar `NUMERIC`. Producto propio: controlar stock global o de variante y descontar una vez. Proveedor: validar disponibilidad/variante, no asumir stock infinito ni descontar `cantidad=0`; marcar `procurement_pending` y exigir confirmación. Mensajería CUP separada. Falta validar estructura real de `variantes_color`, si existen reservas, y tratamiento de ofertas/descuentos.

`ed_pedido_transicionar_privado`: autenticación administrativa y permisos por acción; `SELECT FOR UPDATE`, `expected_version`, grafo de estados permitido, evento append-only y proyección actualizada atómicamente. Supervisor solo lectura; operativo limitado por asignación. `ed_pedido_verificar_pago_privado`: control independiente y evento de pago; no inferir pago de estado de entrega.

## Escenarios de concurrencia futuros — NO EJECUTAR

| Caso | Preparación ficticia y simultaneidad | Resultado esperado |
|---|---|---|
| C01 | Dos clientes intentan comprar la última unidad propia | Un pedido aceptado; otro `OUT_OF_STOCK`; stock no negativo |
| C02 | Dos reintentos simultáneos con mismo cliente, clave y payload | Mismo ID; una cabecera y un descuento |
| C03 | Misma clave con distinto contenido | `IDEMPOTENCY_CONFLICT`; sin segundo pedido |
| C04 | Dos compras multiítem en orden inverso | Bloqueo por ID ordenado, sin deadlock |
| C05 | Dos administradores cambian estado con igual versión | Un evento nuevo; otro `VERSION_CONFLICT` |
| C06 | Primer ítem válido y segundo agotado | Rollback de todas las escrituras, sin pedido parcial |
| C07 | Pedido proveedor sin stock numérico | Sin decremento; no confirmar sin validación de proveedor |
| C08 | Replay tras cancelación | Retorna pedido original, sin segunda reserva |
| C09 | Cliente ajeno y supervisor intentan mutar | `FORBIDDEN`; sin cambios |
| C10 | Timeout tras commit, reintento misma clave | Pedido existente, sin duplicación |
| C11 | Cambia precio entre vista y confirmación | Precio autoritativo nuevo o rechazo explícito; nunca aceptar precio cliente |
| C12 | Editan destinatario tras compra | Snapshot original permanece idéntico |

Para ejecutar en el futuro: entorno staging aislado, datos ficticios, snapshots de ACL/filas, dos conexiones independientes coordinadas por barreras, evidencia de resultados/contadores, limpieza autorizada y verificación posterior. `ROLLBACK` no revierte secuencias. No ejecutar ningún caso sin autorización adicional.

## Seguridad y decisiones pendientes
- No usar `service_role` en navegador; SECURITY DEFINER con `search_path` fijo y EXECUTE mínimo. Auditar `departamentos_admins`, grants y RLS antes de cualquier migración.
- Confirmar `productos.id`, esquema exacto de colores y stock, versión de estados, cancelaciones y compensación de reservas, estado de aprovisionamiento de proveedor y reglas de pago.
- Evitar borrar pedidos históricos como reversión. Reversión futura: apagar flag, volver versión Edge, preservar pedidos y eventos, compensaciones contables auditadas; no resetear secuencias.
- La protección de inmutabilidad requiere triggers/ACL/RPC futuras; este pseudodiseño no implementa ninguna.

## Evidencia offline
`python3 scripts/check_orders_transactions_contract.py` valida que los dos borradores SQL sean inertes, que el plan enumere C01–C12, las invariantes de transacción/idempotencia, el estado de checkout apagado y el cableado de CI. Es una prueba de **presencia de contratos**, no de comportamiento concurrente real.

**NO-GO:** ejecutar SQL, despliegue Edge, prueba HTTP, correos, pagos y pedidos reales.
