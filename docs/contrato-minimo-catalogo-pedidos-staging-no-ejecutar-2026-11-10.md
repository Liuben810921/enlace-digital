# Contrato mínimo de catálogo y pedidos oficiales para staging — NO EJECUTABLE

Base: `88927abc2010f9bf40027c86d51bdfa5313e2c30`. Artefacto: `sql/propuestas/staging_catalogo_pedidos_esquema_minimo_no_ejecutar.sql`, **100 % comentado**. Este trabajo no modifica Supabase ni la tienda.

## Evidencia de partida
La auditoría de lectura del proyecto `enlace-digital-staging` confirmó únicamente `clientes_oficiales`, `clientes_destinatarios` y `clientes_direcciones_entrega` en `public`. No existen allí `productos`, `pedidos_oficiales` ni tablas de inventario. `clientes_oficiales.numero` es `integer/int4`; IDs de destinatarios y direcciones son `bigint/int8`. Los permisos directos de `service_role` sobre `clientes_oficiales` se reportaron denegados; esto no demuestra por sí solo fallos de RPC.

## Diseño propuesto y tipos
1. **`productos` primero:** ID propuesto `bigint` (pendiente de reconciliar con el origen real), `nombre`, `precio_usd numeric(14,2)`, `cantidad integer`, `origen_producto`, `disponible`, `archivado`, `variantes_color jsonb` array. Esta es una **proyección mínima**, NO el DDL completo para la tienda: el frontend tiene otros atributos, fotos, categorías y campos administrativos. Antes de desplegar, enumerar el contrato completo `edFromRow/edToRow` y preservar IDs existentes. Nunca copiar datos de producción sin autorización.
2. **`pedidos_oficiales` después:** ID `bigint`; `cliente_numero integer` FK real a `clientes_oficiales(numero)` con `ON DELETE RESTRICT`. Idempotencia `UNIQUE(cliente_numero,idempotency_key)` y hash del payload. Snapshot completo del receptor y dirección, campos `entrega_direccion` y `total_usd` compatibles con la consulta administrativa actual; estado versionado y pago separado.
3. **Destinatarios/direcciones:** `destinatario_id_origen bigint` y `direccion_entrega_id_origen bigint` opcionales como procedencia histórica. No forzar FK para un receptor nuevo durante checkout ni depender de su edición posterior. Validar en servidor pertenencia al cliente al reutilizar un ID. La copia de datos de entrega del pedido es inmutable.
4. **Ítems:** `pedido_id bigint` FK restrictiva, `producto_id_origen bigint` histórico sin borrado en cascada, `variant_id uuid` futuro, color y atributos congelados, cantidad positiva, precio USD y origen propio/proveedor.
5. **Estados:** tabla de eventos append-only; `pedidos_oficiales.estado` es proyección protegida. Cancelación y liberación solo por operación transaccional idempotente.
6. **Inventario al final:** `inventario_variantes.producto_id` y `inventario_reservas.pedido_id` referencian las tablas anteriores. `variant_id` inmutable, conciliación físico/reservado y proveedor sin stock ficticio. No usar nombre de color como clave estable.

## Seguridad y compatibilidad
- **Permisos:** no dar INSERT/UPDATE/DELETE directos a `anon` ni `authenticated`. RLS en tablas expuestas, EXECUTE limitado en RPC, validación de propietario y roles administrativos en servidor; Supervisor solo lectura. Evitar SECURITY DEFINER en esquema expuesto; si imprescindible, esquema privado, `search_path` fijo, comprobación de identidad y grants explícitos.
- **Dependencias:** `clientes_oficiales(numero integer)` -> `pedidos_oficiales(cliente_numero integer)`; `productos(id bigint)` -> `inventario_variantes(producto_id bigint)`; `pedidos_oficiales(id bigint)` -> `inventario_reservas(pedido_id bigint)`. Las tablas propuestas todavía no existen.
- **Divergencias previas:** borradores antiguos usaban `idempotency_key uuid UNIQUE` global; el contrato unificado usa unicidad por cliente y hash de solicitud. El contrato anterior de ítems no tenía `variant_id` y pedidos no tenían `version`; aquí se añaden para idempotencia y concurrencia. No sobrescribir historia ni aplicar borradores contradictorios.
- **No afirmar integridad de variantes:** no existe `productos` en staging para comparar JSON, stock global o fotos. La migración de datos queda bloqueada hasta inspección autorizada del origen.
- **Punto abierto:** ID `bigint` de catálogo es una propuesta, no un tipo verificado en staging. La interfaz convierte IDs a Number, por lo que deben ser enteros seguros en JavaScript o cambiar contrato antes de activar.

## Matriz de pruebas estáticas y futuras
| Caso | Validación |
|---|---|
| S01 | SQL completamente comentado |
| S02 | FK cliente_numero integer a cliente existente |
| S03 | FK pedidos/variantes ordenadas tras catálogo |
| S04 | Producto proveedor cantidad=0 sin falsa disponibilidad |
| S05 | Colores JSON y variant_id estable compatibles |
| S06 | Precio USD y stock recalculados en servidor |
| S07 | Destinatario nuevo sin FK obligatoria |
| S08 | Snapshot de dirección no cambia tras editar cliente |
| S09 | Idempotencia por cliente y hash |
| S10 | Dos compras última unidad sin sobreventa |
| S11 | Cancelación duplicada libera una sola vez |
| S12 | Roles cliente/supervisor sin escritura directa |
| S13 | Ausencia de tablas en staging bloquea despliegue |
| S14 | Reversión conserva auditoría y pedidos |

**Riesgos y reversión:** sin cambios operativos, revertir esta etapa consiste en revertir commits documentales. En futura implantación, respaldar esquema/datos, establecer puntos de parada y flags, mantener pedidos y movimientos append-only; ante fallo, desactivar escrituras y compensar auditadamente, no borrar historia. **NO-GO** para ejecutar SQL, desplegar, habilitar servicios, correos o pedidos reales.
