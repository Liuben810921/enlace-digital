# Auditoría offline de variantes, reservas y cancelaciones — 2026-11-09

**Solo lectura del código y documentación. NO se ejecutó SQL ni se modificó la tienda.** Base autorizada: `f60049426bd8413bfca156140b4cddd807c7833c`. Referencia: `staging-preview/index.html` y propuestas SQL inertes.

## Contratos observados en la interfaz
- `edFromRow` convierte `productos.variantes_color` a `p.colors`, preservando el array de objetos; `edToRow` lo guarda de nuevo como `variantes_color`.
- Los objetos de variante contienen `name`, `qty`, `photos`, y paleta `hex` cuando aplica. La edición exige nombres únicos **ignorando mayúsculas**, cantidades enteras no negativas y máximo cinco fotos por color. La validación de nombres no canoniza espacios, tildes ni Unicode.
- En productos propios con variantes, `createProduct` y `saveEditProduct` calculan `p.qty` como **suma de `v.qty`**; la fuente operativa para color es `v.qty`. En productos sin variantes, `p.qty` es el stock global.
- `edToRow` persiste `cantidad=0` para proveedores y `edFromRow` lo representa como `qty=null`. Los proveedores se filtran por `disponible` y `archivado`, y `canOrder` comprueba la existencia del nombre del color, **no su cantidad**.
- `isAvailable`, `canOrder`, `validateCart` y `validateDetailQty` operan sobre el estado del navegador. No garantizan concurrencia entre compradores ni sustituyen un bloqueo transaccional.
- `updateDemoOrder` cambia estados solo de pedidos de demostración almacenados localmente. **No existe contrato operativo verificado de devolución de stock para pedidos oficiales**.

## Inconsistencias y riesgos
1. **Dos fuentes de cantidad:** `cantidad` global y `variantes_color[*].qty` pueden divergir si otra operación modifica una sin recalcular la otra. Futuro backend debe imponer una única fuente de verdad y actualizar ambas de manera atómica, o derivar el total sin almacenarlo.
2. **Clave de variante:** `name` es editable; si cambia el nombre después de una reserva, el registro histórico debe conservar un identificador estable de variante. La propuesta futura necesita `variant_id` inmutable o un identificador estable asignado al reservar, con política para variantes heredadas.
3. **Normalización:** nombres de color únicos solo por minúsculas en UI; un backend debe aplicar canonicalización explícita (trim, Unicode NFC, casefold según política) y rechazar colisiones. No deducir disponibilidad por hex o foto.
4. **Proveedor:** `cantidad=0` es convención de persistencia, **no stock cero ni infinito**. No reservar ni descontar; confirmar disponibilidad externa antes de transición `confirmado`. Mantener `pendiente` o subestado interno `procurement_pending`.
5. **Reserva frente a descuento:** el contrato previo mezcla ambos términos. Decisión propuesta: un único libro mayor de movimientos/reservas por pedido, producto y variante, con unicidad y estado; evitar doble descuento al reintentar. La política definitiva de reservar al crear o descontar al confirmar requiere aprobación.
6. **Cancelación:** liberar **solo una reserva activa** una vez, con transición y evento auditable en la misma transacción; no liberar si ya fue consumida, liberada o no existió. Estados `en_camino`/`entregado` requieren flujo de devolución distinto, no reposición automática.
7. **Edición concurrente de catálogo:** cambios administrativos de cantidad, colores, archivado o disponibilidad deben coordinarse con la misma fila/bloqueo de producto y versionado para no sobrescribir movimientos de stock.
8. **Identidad del producto:** `productos.id` se trata como numérico; las líneas históricas conservan `producto_id_origen bigint`, nombre, color, precio y atributos independientes del catálogo vivo.
9. **Duplicados de carrito:** agrupar por `(producto_id,variant_id)` antes de bloquear; evitar que varias líneas de igual variante superen la disponibilidad total.
10. **Historial:** conservar eventos append-only de reserva, consumo, liberación y cancelación; nunca alterar snapshot histórico de ítems, destinatario y precio.

## Contrato de transacción propuesto (NO implementado)
- Ordenar IDs de productos; bloquear `productos` con `SELECT ... FOR UPDATE` dentro de la misma transacción que crea el pedido.
- Validar `origen_producto`, `disponible`, `archivado`, `precio_usd` y cantidades por variante; para propios con variantes, verificar `v.qty >= cantidad` y decrementar la variante, recalculando total; para propios sin variantes, verificar y decrementar `cantidad`.
- Para proveedores, comprobar nombre de variante si existe, no tocar cantidades; registrar necesidad de confirmación de proveedor.
- Guardar movimiento de inventario con identidad única por `pedido_id, producto_id, variant_id, tipo_movimiento` y una máquina de estados que impida liberar dos veces; diseñar ledger y restricciones antes de implementación.
- Aplicar idempotencia `(cliente_numero,idempotency_key)` y hash del payload. Reintentos idénticos retornan mismo pedido, sin nuevos movimientos.
- En cancelación, bloquear pedido y productos en orden consistente, validar estado y versión, liberar únicamente reserva elegible, añadir evento y actualizar proyección. Un error revierte todo, salvo avances de secuencia no transaccionales.
- La futura API no podrá activar pedidos hasta definir reserva/descuento, expiración de reservas, devoluciones y capacidad de roles.

## Pruebas de aceptación futuras (solo escenarios)
| ID | Caso | Resultado esperado |
|---|---|---|
| V01 | Dos compradores compiten por última unidad de color | Una reserva, otro OUT_OF_STOCK |
| V02 | Dos colores del mismo producto | Stock independiente por variante; total consistente |
| V03 | Dos líneas del mismo color | Cantidad agregada, no sobreventa |
| V04 | Replay de idempotencia | Un pedido y un movimiento |
| V05 | Cancelación simultánea duplicada | Una liberación y un evento válido |
| V06 | Cancelación tras entrega | No reponer automáticamente |
| V07 | Edición administrativa concurrente | No se pierden cambios de stock |
| V08 | Variante renombrada después del pedido | ID estable y snapshot original conservado |
| V09 | Proveedor con `cantidad=0` | Sin decremento ni confirmación automática |
| V10 | Fallo en segundo ítem | Rollback completo de pedido, movimientos y stock |
| V11 | Nombre de variante duplicado tras normalización | Rechazo por colisión |
| V12 | Cambio de stock entre carrito y compra | Validación autoritativa en servidor |

## Reversión y criterios NO-GO
No hay nada desplegado que revertir en esta etapa. Para pruebas futuras, snapshot de esquema/ACL, datos ficticios, transacciones aisladas y aprobación explícita; comprobar balances antes/después. Revertir código o flags no borra movimientos históricos; corregir mediante compensaciones auditadas. No eliminar pedidos reales ni reiniciar secuencias. **NO-GO** mientras falten esquema real de variante estable, política de reservas y liberación, permisos y pruebas de concurrencia autorizadas.
