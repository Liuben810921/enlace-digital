# Especificación única de futuras migraciones staging — SOLO DOCUMENTACIÓN, NO EJECUTABLE

Base autorizada `d1ca9c1f1eeaa6f82c591cf9e3e0042851920a7d`. Precedencia: `docs/plan-maestro-catalogo-pedidos-inventario-reservas-no-ejecutable-2026-11-10.md`. Esta especificación define **nombres de artefactos futuros, no archivos SQL ejecutables ni migraciones creadas**. Prohibido ejecutar SQL, modificar Supabase/producción, desplegar, activar correos, servicios o pedidos reales.

## Contratos previos verificados y bloqueos
La última auditoría autorizada de staging encontró `clientes_oficiales`, `clientes_destinatarios` y `clientes_direcciones_entrega`; faltan `public.productos`, `public.pedidos_oficiales` e inventario. `clientes_oficiales.numero` es `integer/int4`; destinatarios y direcciones tienen ID `bigint/int8`. Se observaron permisos directos denegados a `service_role` sobre `clientes_oficiales`, sin demostrar fallo de RPC. Es evidencia histórica de esa lectura, no comprobación nueva. No asumir datos de catálogo en staging.

`edToRow` emite `id,nombre,marca,modelo,descripcion,categoria,precio_usd,cantidad,disponible,imagenes,especificaciones,origen_producto,archivado,variantes_color,updated_at` (15 campos). `edFromRow` no rehidrata marca/modelo; evitar pérdida silenciosa. `categoria` es texto, imágenes y variantes JSON, `__freeShipping` y `__condition` están en especificaciones. `productos_proveedores_privados` contiene alias reservado. La UI usa `Number(id)` y `max+1`: antes de elegir `bigint`, comprobar seguridad de enteros y reconciliar IDs; nunca remapear pedidos históricos.

## Manifiesto de archivos FUTUROS, en orden estricto
| Orden | Archivo futuro sugerido (NO creado) | Depende de | Puerta |
|---|---|---|---|
| G00 | `migrations/00_preflight_staging_readonly.sql` | Proyecto staging verificado, permisos explícitos | Metadatos y backups aprobados; lectura sin secretos |
| G01 | `migrations/01_catalogo_productos.sql` | G00, tipo de ID y 15 campos conciliados | Producto propio/proveedor, JSON, fotos, marca/modelo, categorías |
| G02 | `migrations/02_catalogo_privado_departamentos.sql` | G01, mapeo de categorías/roles | Alias privado principal-only; departamento opcional sin FK prematura |
| G03 | `migrations/03_pedidos_oficiales.sql` | G00, cliente integer y G01 | FK `cliente_numero integer` restrictiva; idempotencia cliente + hash |
| G04 | `migrations/04_pedidos_items_eventos.sql` | G03, G01 | Snapshots inmutables, FK pedido RESTRICT, eventos append-only |
| G05 | `migrations/05_variantes_inventario.sql` | G01, G02, conciliación de JSON | `variant_id uuid` inmutable, stock físico/reservado, proveedor sin stock propio |
| G06 | `migrations/06_reservas_movimientos.sql` | G03, G04, G05 | FK pedido y variante, idempotencia de transición, ledger append-only |
| G07 | `migrations/07_rpc_permisos_rls.sql` | G01–G06, revisión de funciones existentes | RLS, REVOKE, RPC backend restringidas y auditoría |
| G08 | `tests/08_integridad_concurrencia_staging.sql` | G07 y aprobación de pruebas aisladas | Pruebas con datos ficticios, rollback, sin pedidos reales |
| G09 | `runbooks/09_cutover_rollback.md` | G08 y nueva autorización | Corte controlado y reversión con preservación de historia |

Los nombres anteriores son **referencias**, no instrucciones de despliegue. Cada G01–G08 requerirá aprobación específica y un artefacto revisado; G09 no autoriza activar nada.

## Contratos transversales obligatorios
- **Tipos:** `clientes_oficiales.numero integer` -> `pedidos_oficiales.cliente_numero integer`; `productos.id bigint` y `pedidos_oficiales.id bigint` son **propuestas pendientes de verificación**, y sus FKs dependientes deberán usar exactamente el tipo real. `variant_id uuid`, `cantidad integer > 0`, `precio_usd numeric(14,2)`, `stock_fisico integer >= 0`, `stock_reservado integer >= 0`, `stock_reservado <= stock_fisico`.
- **Catálogo:** preservar 15 campos y valores JSON; máximo cinco fotos por producto/color según UI, con validación futura en servidor y Storage; `categoria text` compatible hasta mapear UUID; `marca/modelo` no deben vaciarse por un roundtrip. Proveedor `cantidad=0` legacy no significa agotado ni stock infinito.
- **Pedido:** `UNIQUE(cliente_numero,idempotency_key)` y `request_sha256`; receptor y dirección como snapshot inmutable; IDs de destinatario/dirección opcionales y validados por pertenencia; items con nombre, precio, origen, color, atributos y `variant_id` nullable durante transición.
- **Inventario:** propio con UUID estable por color o variante sintética sin color; reconciliar `cantidad` global y suma `qty`; abortar duplicados Unicode, negativos o discrepancias. Reservar +reservado, consumir −reservado y −físico, cancelar antes de consumir −reservado exactamente una vez. Proveedor con confirmación por línea sin movimiento de stock propio.
- **Seguridad:** `anon` y `authenticated` sin escritura directa a tablas críticas; `service_role` y rutas RPC deben verificarse antes de modificar grants. RLS por tabla, supervisor solo lectura, principal acceso al alias privado. `SECURITY DEFINER` solo en esquema restringido, `search_path` fijo, EXECUTE mínimo, comprobación de identidad/propiedad.
- **Concurrencia:** bloquear filas en orden determinista, versión optimista donde corresponda, reintentos idempotentes; todo pedido multítem y sus reservas en una transacción; no hay garantía de concurrencia con validación de navegador.

## Matriz de verificación y aceptación
| ID | Fase | Evidencia exigida antes de aprobación |
|---|---|---|
| T01 | G00 | Esquema staging, tipos, grants y políticas documentados sin lectura de datos personales |
| T02 | G01 | Roundtrip 15 campos, fotos, marca/modelo, categorías, condición |
| T03 | G01 | IDs originales conservados y enteros seguros en JS |
| T04 | G02 | Alias proveedor privado, sin acceso público |
| T05 | G03 | FK cliente integer y rechazo de idempotency_key reutilizada con payload distinto |
| T06 | G04 | Snapshots de pedido no cambian tras edición/archivo |
| T07 | G05 | UUID estable tras renombrar color y conciliación de cantidades |
| T08 | G05 | Proveedor no crea stock propio |
| T09 | G06 | Última unidad, dos reservas simultáneas: una sola aceptación |
| T10 | G06 | Cancelación duplicada/expiración: una transición terminal |
| T11 | G06 | Consumo único; devolución auditada sin reposición automática |
| T12 | G07 | RLS, REVOKE, RPC y separación de roles |
| T13 | G08 | Rollback total de pedido multítem fallido |
| T14 | G08 | Reintento idempotente sin movimientos duplicados |
| T15 | G08 | Falla de carga de foto/Storage sin pérdida silenciosa |
| T16 | G09 | Reversión preserva pedidos, snapshots y ledger |
| T17 | Todas | `ED_REAL_CHECKOUT_ENABLED=false`, sin activar servicios |
| T18 | Actual | Solo documentación, scripts de validación estática y CI offline |

**Criterio NO-GO:** cualquier tipo no verificado, FK ausente, permiso no auditado, discrepancia de stock, idempotencia indefinida, datos históricos sin snapshot o resultado de prueba funcional pendiente bloquea ejecución. Las T01–T18 son requisitos de aceptación futuros; el chequeo estático solo verifica que estén documentados.

## Reversión por etapas
- **Etapa actual:** revertir únicamente commits de documentación/pruebas estáticas/CI; cero datos que restaurar.
- **Antes de futuro cutover:** snapshot/backup autorizado, comprobación de dependencias, desactivar escritura de pruebas, no borrar objetos con referencias.
- **Después de futuro cutover:** suspender escrituras y checkout, preservar snapshots y ledger append-only, conciliar reservas, aplicar compensaciones auditadas; no DROP histórico ni reactivar escritor JSON legacy con reservas activas.
- **Gobernanza:** un responsable aprueba cada fase y su reversión por separado. Nunca mezclar borradores SQL históricos en una ejecución.

## Relación con borradores existentes
`sql/propuestas/staging_catalogo_contrato_completo_no_ejecutar.sql` define los 15 campos, mientras `sql/propuestas/staging_catalogo_pedidos_esquema_minimo_no_ejecutar.sql` es solo subconjunto ilustrativo y no debe usarse para crear catálogo operativo. `sql/propuestas/staging_migracion_inventario_reservas_borrador_no_ejecutar.sql` supone FKs que todavía no existen y su `UNIQUE(idempotency_key,tipo,variant_id)` requiere refinarse a identidad de operación lógica antes de migrar. Este documento y el plan maestro prevalecen como especificación, no como autorización de ejecución.

**NO-GO: no SQL ejecutado, no Supabase ni producción modificados, no despliegue, no correos, no servicios, no pedidos reales.**
