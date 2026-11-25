# Diseño unificado de inventario y reservas — NO EJECUTABLE

Fecha: 2026-11-09. Base: `e4b6947e902436e22fff76974e36a453d28225d9`.
**Estado: propuesta documental; NO migración ni implementación.** No se han cambiado productos, pedidos, Supabase ni código de la tienda.

## Compatibilidad actual
El catálogo usa `public.productos.id` numérico, `cantidad`, `origen_producto`, `disponible`, `archivado` y `variantes_color` (array JSON). Cada variante contiene `name`, `qty`, `photos` y opcionalmente `hex`. El navegador calcula el total propio por suma de variantes y persiste `cantidad=0` para proveedores. No existe una identidad estable de variante en el contrato actual; `name` es editable. La propuesta no presupone una tabla de variantes ya existente.

## Modelo lógico futuro (solo diseño)
- `inventario_variantes`: `variant_id uuid` inmutable, `producto_id bigint`, `nombre_visible`, `nombre_normalizado`, `activo`, `stock_fisico integer`, `stock_reservado integer`, `version bigint`; una variante sintética `SIN_VARIANTE` para productos propios sin colores. El UUID estable no cambia al renombrar, cambiar foto ni ajustar paleta. Definir una sola fuente de verdad y derivar `productos.cantidad` o actualizarlo dentro de la misma transacción; no permitir divergencias.
- `inventario_reservas`: `reserva_id uuid`, `pedido_id bigint`, `producto_id bigint`, `variant_id uuid`, `cantidad integer`, `estado` (`activa`, `consumida`, `liberada`, `expirada`), `version`, `created_at`, `expires_at`. Unicidad de reserva por pedido/producto/variante y prohibición de cantidad no positiva. La política de expiración debe decidirse antes de implementar.
- `inventario_movimientos`: eventos append-only con `movement_id uuid`, `reserva_id`, `tipo` (`reservar`, `consumir`, `liberar`, `ajustar`, `devolver`), `delta`, `actor`, `idempotency_key`, `created_at`, motivo y correlación. Claves únicas para impedir doble aplicación de un movimiento lógico; las correcciones son compensaciones, no borrados.
- `inventario_proveedores`: solo disponibilidad declarada, `confirmacion_proveedor` (`pendiente`, `confirmada`, `rechazada`), referencia opcional y vigencia; **sin inventar stock**. No reservar ni descontar cantidades de `cantidad=0`; las confirmaciones son por pedido/línea, no stock propio.
- `pedidos_oficiales_items` congela `variant_id`, nombre de color, cantidad, precio, origen y atributos del momento de compra. Renombrar un color no modifica el snapshot.

## Política recomendada, pendiente de aprobación
1. Para producto **propio**, reservar al crear pedido aceptado y consumir al confirmar preparación/entrega según política definitiva. Disponible = `stock_fisico - stock_reservado` mientras la reserva esté activa; al consumir, disminuir físico y reservado en la misma transacción. **No descontar físico al reservar y volver a descontarlo al consumir.**
2. Para producto **proveedor**, registrar solicitud pendiente de verificación; no crear reserva de stock propio ni declarar disponibilidad ilimitada. La transición a `confirmado` exige confirmación de proveedor; cancelación cancela la solicitud sin restaurar inventario inexistente.
3. Cancelación antes del consumo: liberar reserva activa **exactamente una vez**, disminuir reservado sin alterar físico, registrar evento. Cancelación después del consumo: **no reposición automática**; devolución/entrada de stock exige recepción y operación auditada. Cancelación de pedido `en_camino` o `entregado` requiere flujo de devolución específico.
4. Reserva expirada: una tarea futura, expresamente autorizada, debe bloquear reserva y pedido, comprobar elegibilidad y liberar una vez; no habilitar tareas automáticas ni cron ahora. Evitar expiración silenciosa de pedidos confirmados.
5. Editar stock o colores: bloquear la misma identidad de producto/variante que los pedidos; registrar ajuste con motivo. No permitir borrar variante con reservas o historial; desactivar conservando `variant_id`. Migrar variantes heredadas mediante mapeo controlado y validación de duplicados normalizados.
6. Un pedido con varias líneas de igual variante agrega cantidades antes de verificar disponibilidad. Bloqueo determinista por `producto_id,variant_id`; idempotencia por cliente/solicitud y versión optimista para cambios de estado. Ningún paso confía en el precio o cantidad del navegador.
7. Roles: Principal y General según permisos explícitos; Operativo solo capacidades asignadas; Supervisor lectura exclusivamente. La autorización se comprueba en servidor; no exponer escrituras directas de tablas a cliente o roles de navegador.

## Invariantes para futura implementación
- `stock_fisico >= 0`, `stock_reservado >= 0`, `stock_reservado <= stock_fisico`; disponibilidad nunca negativa.
- Una reserva activa se consume, libera o expira como transición terminal única; reintentos retornan el mismo resultado sin duplicar movimientos.
- Cada evento tiene identidad y causa única; conciliación: reservas activas = suma de `stock_reservado` por variante; los movimientos explican las diferencias físicas.
- Una transacción incluye pedido, ítems, reservas, movimientos, snapshot y eventos; fallo parcial implica rollback completo, excepto secuencias no transaccionales.
- Identidad estable de variante y snapshots históricos no mutables; referencias históricas permanecen aunque producto se archive.
- Reversión operativa futura: apagar flag y revertir código, **sin borrar pedidos, reservas o auditoría**. Reparaciones mediante movimientos compensatorios y autorización.

## Riesgos y decisiones abiertas
- **Migración:** asignar `variant_id` a variantes JSON heredadas sin perder nombres, fotografías ni cantidades; evitar colisiones por nombre normalizado. La estrategia de compatibilidad temporal y fuente única de stock necesita aprobación.
- **Conteo físico:** confirmar si `cantidad` y `variantes_color[*].qty` coinciden en datos reales mediante consulta de solo lectura autorizada en etapa posterior.
- **Reserva:** decidir plazo, momento de consumo, tratamiento de pedidos sin pago, cancelaciones tardías y liberación automática. No hay política aprobada.
- **Proveedores:** definir quién verifica disponibilidad, vigencia de confirmación, cambios de precio y sustituciones; no inferir disponibilidad garantizada.
- **Seguridad:** faltan DDL/RLS/grants, permisos administrativos, triggers de inmutabilidad y pruebas reales de carrera. El SQL propuesto permanece comentado.
- **Concurrencia:** pruebas estáticas no demuestran ausencia de sobreventa; se necesitan dos conexiones a staging y fixtures ficticias tras autorización.

## Matriz reproducible de escenarios futuros (NO ejecutados)
| ID | Escenario | Aserción |
|---|---|---|
| I01 | Dos pedidos por última unidad de variante | Una reserva; sin sobreventa |
| I02 | Dos colores del mismo producto | Stock aislado por variant_id |
| I03 | Múltiples líneas mismo color | Suma previa y una reserva |
| I04 | Dos reintentos misma idempotency_key | Un pedido y un movimiento |
| I05 | Renombrar variante reservada | variant_id estable; snapshot intacto |
| I06 | Cancelar dos veces reserva activa | Una liberación, sin stock inflado |
| I07 | Cancelar tras consumo | No reposición automática |
| I08 | Expirar y cancelar simultáneamente | Una transición terminal |
| I09 | Pedido de proveedor | Cero reserva propia; confirmación pendiente |
| I10 | Ajuste admin y compra concurrentes | Sin actualización perdida |
| I11 | Fallo en segunda línea | Rollback de pedido y movimientos |
| I12 | Variante heredada duplicada tras normalizar | Migración rechaza colisión |
| I13 | Supervisor intenta alterar stock | FORBIDDEN |
| I14 | Stock global vs suma por color | Reconciliación consistente |

**NO-GO para ejecutar SQL, desplegar, activar pedidos, correos o tareas automáticas.**
