# Auditoría de solo lectura: esquema real de Supabase staging — 2026-11-10

**Proyecto verificado:** `enlace-digital-staging` (`xqahthghvozeigbojhyi`), separado del proyecto `enlace-digital-db`. Se utilizaron exclusivamente metadatos de tablas y consultas `SELECT` de catálogos PostgreSQL; **ninguna escritura, DDL, migración, despliegue ni consulta a producción**.

## Evidencia del esquema actual
- La enumeración de `public` devuelve **solo tres tablas**: `clientes_oficiales`, `clientes_destinatarios` y `clientes_direcciones_entrega`. Las tres tienen RLS activado.
- **No existen en este staging:** `public.productos`, `public.pedidos_oficiales`, `public.pedidos_oficiales_items`, `public.inventario_variantes`, `public.inventario_reservas` ni `public.inventario_movimientos`. Confirmado tanto por enumeración de tablas como por `information_schema.tables`.
- `clientes_oficiales.numero` es **integer/int4**, no bigint. `clientes_destinatarios.id` y `clientes_direcciones_entrega.id` son **bigint/int8**; ambas referencias `cliente_numero` son **integer/int4**. No se debe inferir que el futuro `productos.id` sea bigint sin comprobarlo en la fuente real.
- No es posible comprobar **filas reales de productos**, formas JSON de `variantes_color`, discrepancias entre `cantidad` y `qty`, colisiones de colores o stock negativo: **la tabla productos no existe en staging**. No se inventan resultados de integridad.
- Las tres tablas de clientes se reportan con **0 filas estimadas** por el listado administrativo; no se efectuó lectura de datos personales ni conteos exhaustivos.

## Privilegios observados (metadatos has_table_privilege)
- Para `clientes_destinatarios` y `clientes_direcciones_entrega`, `anon` y `authenticated` no tienen SELECT/INSERT/UPDATE/DELETE; `service_role` sí tiene los cuatro privilegios de tabla.
- Para `clientes_oficiales`, `anon`, `authenticated` y **`service_role`** reportan **false** en SELECT/INSERT/UPDATE/DELETE. **Revisar este punto antes de integrar pedidos o asumir acceso de backend.** Las funciones SECURITY DEFINER o grants específicos podrían cambiar rutas de acceso; estos metadatos **no prueban** que toda operación de cliente falle.
- RLS habilitado **no equivale** a permisos completos; faltaría verificar políticas y funciones específicas antes de concluir seguridad extremo a extremo.
- No se ha examinado ni modificado ningún secreto, valor de credencial, token o dato de cliente.

## Incompatibilidades con propuesta de migración
1. **Bloqueo estructural P0:** el borrador contiene FK `inventario_variantes.producto_id -> public.productos(id)` y `inventario_reservas.pedido_id -> public.pedidos_oficiales(id)`; ambas tablas destino **faltan**. No aplicar propuesta de inventario en staging.
2. **Tipos P0:** `producto_id bigint` y `pedido_id bigint` son supuestos documentales; primero debe definirse el DDL de catálogo y pedidos en staging y comprobar tipos reales.
3. **Backfill P0:** no hay `productos.variantes_color` para migrar. El catálogo actual se observa en código `staging-preview/index.html`, **no** en tablas del proyecto staging consultado.
4. **Permisos P1:** revisar acceso de `service_role` a `clientes_oficiales` y las rutas RPC existentes antes de referenciar clientes desde pedidos. No ampliar grants sin diseño de mínimo privilegio.
5. **Stock P1:** sin filas no es posible afirmar que existan o no divergencias, colisiones o stock negativo. Mantener la puerta de conciliación pendiente.
6. **Secuencia P0:** el orden correcto de futuros artefactos es: catálogo de staging y contrato de ID -> pedidos oficiales y FKs -> variantes/reservas/movimientos -> backfill y conciliación -> pruebas de concurrencia -> eventual cutover autorizado. Ninguno está autorizado para ejecución.

## Recomendación y reversión
Mantener **NO-GO** para ejecutar la migración. Preparar, en una etapa posterior **exclusivamente documental y previa autorización**, un contrato de catálogo mínimo compatible con staging y el esquema de pedidos que desbloquee FKs, sin copiar ni afectar producción. No hay operaciones en staging que revertir: esta etapa fue solo lectura.

## Pruebas estáticas de esta auditoría
El script offline comprueba que el informe consigne la ausencia de tablas, el tipo `integer/int4` del cliente, el hallazgo de permisos y la prohibición de declarar integridad de stock sin datos. Las comprobaciones en GitHub Actions son **estáticas**, no reproducen las consultas a staging ni ejecutan SQL.
