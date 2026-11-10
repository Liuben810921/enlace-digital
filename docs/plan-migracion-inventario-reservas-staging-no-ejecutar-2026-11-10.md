# Propuesta de migración de inventario y reservas para staging (NO EJECUTABLE)

Base autorizada: `cc7895c33005c17451c3f1f1e1712217eb83eeae`. Borrador inerte: `sql/propuestas/staging_migracion_inventario_reservas_borrador_no_ejecutar.sql`. **No se ha ejecutado SQL ni cambiado Supabase, producción, servicios o pedidos.**

## Orden de dependencias y puertas de aprobación
1. **Preflight de solo lectura futuro:** inspeccionar tipos reales de `productos.id`, `cantidad`, `variantes_color`, `origen_producto`; verificar si existen `pedidos_oficiales` y roles/permisos; validar cantidades negativas, nulas, fraccionarias, duplicados normalizados, suma de colores frente a total y productos archivados. La existencia de tablas no está demostrada por este documento.
2. **Migración estructural futura:** tabla `inventario_variantes` con UUID inmutable, FK producto, `stock_fisico`, `stock_reservado`, versión, nombre normalizado, variante sintética sin color y restricciones de no negativos; `inventario_reservas` con FK pedido y variante compuesta, estado terminal único; `inventario_movimientos` append-only con correlación e idempotencia. FK a `pedidos_oficiales` impide desplegar antes de aprobar su esquema.
3. **Backfill futuro:** asignar UUID estable a cada variante JSON heredada y conservar mapeo, nombre, fotos y color; rechazar duplicados tras canonicalización Unicode NFC + trim + case policy. No convertir productos de proveedor en stock propio; `cantidad=0` no es agotado ni ilimitado. Productos propios sin color reciben variante sintética. Cualquier diferencia entre `cantidad` y suma por color es un bloqueo de migración, no una corrección silenciosa.
4. **Cutover futuro:** una sola autoridad de stock; backend transaccional y permisos antes de habilitar pedidos. Mantener la UI existente sin modificaciones en esta etapa. No permitir escrituras directas de JSON heredado mientras existan reservas activas.
5. **Seguridad:** REVOKE a PUBLIC/anon/authenticated, RLS sin escrituras directas de navegador, EXECUTE de funciones solo al backend autorizado, SECURITY DEFINER con search_path fijo, auditoría append-only y roles supervisor de solo lectura. Debe validarse compatibilidad de grants y triggers existentes antes de aplicar.
6. **Transacciones:** ordenar bloqueos por producto y variante; validar precios, stock y estados en servidor. Reservar aumenta reservado, consumir disminuye reservado y físico, liberar disminuye solo reservado. Un mismo evento no puede aplicarse dos veces. Proveedor exige verificación externa, no movimiento de inventario propio.
7. **Reversión:** antes de cutover no tocar datos operativos; después de cutover desactivar escritura y pedidos, conservar ledger y pedidos, compensar con eventos auditados y reconciliar. Prohibido eliminar reservas históricas o reactivar escritor legacy sin compatibilidad.

## Invariantes y riesgos explícitos
- `0 <= stock_reservado <= stock_fisico`; el disponible es físico menos reservado.
- La FK `pedido_id` requiere que la tabla propuesta de pedidos oficiales exista primero. El tipo `bigint` es supuesto a verificar, no hecho confirmado.
- `UNIQUE (idempotency_key,tipo,variant_id)` es propuesta inicial; definir identidad de operación para eventos independientes y evitar colisiones legítimas.
- Un CHECK no puede imponer que la variante pertenezca a un producto `propio` en otra tabla; requiere función/trigger o API transaccional restringida.
- Expiración de reservas, cuándo consumir, devoluciones y comprobación de proveedor siguen pendientes de aprobación ejecutiva.
- No se garantizan carreras ni permisos mediante pruebas estáticas; solo staging con autorización y conexiones aisladas podrá demostrarlo.

## Matriz de pruebas estáticas y futuras
| ID | Escenario | Resultado exigido |
|---|---|---|
| M01 | SQL de propuesta | Todas las líneas comentadas |
| M02 | Producto propio con dos colores | Dos UUID estables; suma conciliada |
| M03 | Producto propio sin colores | Variante sintética |
| M04 | Producto proveedor con cantidad=0 | Sin stock propio ni reserva |
| M05 | Nombre normalizado duplicado | Backfill aborta |
| M06 | Stock global y colores divergentes | Backfill aborta y documenta |
| M07 | Dos reservas de última unidad | Una gana, otra sin stock |
| M08 | Dos cancelaciones simultáneas | Una sola liberación |
| M09 | Cancelación tras consumo | No repone físico automáticamente |
| M10 | Expiración contra cancelación | Una transición terminal |
| M11 | Admin edita stock durante compra | Sin actualización perdida |
| M12 | Fallo en segundo ítem | Rollback completo |
| M13 | Supervisor intenta escribir | Acceso denegado |
| M14 | Renombrar color con pedido existente | UUID y snapshot inmutables |
| M15 | Reintento idempotente | Sin reserva duplicada |
| M16 | Corte y reversión posterior | Ledger preservado y conciliado |

**NO-GO:** ningún SQL, migración real, despliegue, correo, pedido o modificación de Supabase autorizado en esta etapa. Los casos M02–M16 son diseños reproducibles para ejecución posterior; no se presentan como pruebas funcionales ya ejecutadas.
