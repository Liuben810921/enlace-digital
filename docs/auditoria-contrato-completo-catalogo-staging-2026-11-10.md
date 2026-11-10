# Auditoría offline de contrato completo del catálogo — 2026-11-10

Base: `bab1646e1137f9b613dac081e4ec81bc2b8a3333`. Fuente: `staging-preview/index.html` en GitHub. **No se ha consultado ni modificado Supabase en esta etapa**. Propuesta inerte: `sql/propuestas/staging_catalogo_contrato_completo_no_ejecutar.sql`.

## Contrato exacto de persistencia
`edToRow(p)` produce estas 15 claves: `id`, `nombre`, `marca`, `modelo`, `descripcion`, `categoria`, `precio_usd`, `cantidad`, `disponible`, `imagenes`, `especificaciones`, `origen_producto`, `archivado`, `variantes_color`, `updated_at`.

`edFromRow(p)` lee `id`, `nombre`, `categoria`, `precio_usd`, `cantidad`, `origen_producto`, `disponible`, `descripcion`, `especificaciones`, `imagenes`, `archivado`, `variantes_color`. Los campos `marca`, `modelo` y `updated_at` no son rehidratados; `edToRow` escribe `marca:''` y `modelo:''`, con riesgo de sobrescribir información previa. La estructura `especificaciones` contiene `__freeShipping` y `__condition` (claves de `ED_CONDITIONS`).

**Modelo de frontend:** `id:Number(p.id)`, `name`, `cat`, `price`, `qty`, `origen_producto`, `disponible`, `desc`, `tech`, `photos`, `icon`, `archivado`, `colors`, `freeShipping`, `condition`. `icon:'📦'` es valor UI, no columna persistida.

## Hallazgos por dominio
- **IDs:** `createProduct` calcula `Math.max(...ids,0)+1`; el futuro `bigint identity` requiere reconciliar IDs existentes, y evitar colisiones entre administradores. El paso por JS `Number` exige enteros seguros (`Number.MAX_SAFE_INTEGER`).
- **Departamentos:** `categoria` es texto, los selectores usan `state.categories` y `initialCats`; no se observó FK a tabla de departamentos. Una tabla con UUID y orden/visibilidad sería futura y debe migrar nombres y renombres sin perder asociación. No asumir que `initialCats` representa la lista final aprobada.
- **Fotografías:** `imagenes` es array JSON; la UI admite máximo cinco por producto, y cada color hasta cinco fotos. `edUploadPhoto` sube objetos a Storage `productos`, pero la cola hace POST/PATCH de filas y carga fotos en pasos separados. Un fallo parcial puede dejar objetos huérfanos o un catálogo a medio sincronizar. No se inspeccionó Storage.
- **Colores:** `variantes_color` es array JSON con `name`, `qty`, `photos`, opcional `hex`. La unicidad actual es por nombre en minúsculas; no hay UUID estable. Renombrar un color puede romper referencias de carrito/pedidos. Normalizar y migrar a `variant_id uuid` permanente en etapa posterior.
- **Propio:** `cantidad` se calcula como suma de `qty` de colores cuando existen; sin colores se usa `qty` global. `isAvailable`, `canOrder` y `validateCart` validan en navegador; no son una reserva transaccional.
- **Proveedor:** `edToRow` persiste `cantidad=0`, `edFromRow` expone `qty=null`; la disponibilidad depende de `disponible`, no de stock propio. No descontar existencias ficticias.
- **Alias privado:** `productos_proveedores_privados` se consulta/escribe mediante REST y `edAdminRole==='principal'`; tabla separada propuesta con FK restrictiva. El código no demuestra que los permisos de servidor coincidan; revisar RLS antes de implementación.
- **Edición:** `saveEditedProduct` modifica el objeto local, llama `save()` y espera `edInventoryQueue`; `edQueueInventory` recorre productos y ejecuta POST/PATCH individuales, y archiva faltantes. No hay transacción multi-producto ni bloqueo optimista verificado. `deleteProductForever` realiza DELETE; las futuras FKs deben proteger historia de pedidos.
- **Pedidos:** conservar `nombre_producto`, `variante_color`, `variant_id` futuro, `atributos_snapshot`, `precio_unitario_usd`, `cantidad`, `origen_producto` y `producto_id_origen` como procedencia histórica. No actualizar snapshots tras editar/archivar/eliminar producto.

## Riesgos y puertas de compatibilidad
P0: staging carece de `public.productos`, pedidos e inventario (auditoría previa). No aplicar SQL. P0: resolver IDs y esquema completo antes de FKs. P0: futura autoridad transaccional de stock y pedidos; UI actual no evita sobreventa concurrente. P1: preservar marca/modelo, fotos, categorías y alias privado. P1: validar JSON en servidor y referencias Storage, límites de cinco y colisiones Unicode. P1: proteger integridad de pedidos contra DELETE físico. P1: confirmar permisos reales y política de roles sin conceder escritura pública.

## Pruebas estáticas / escenarios futuros
| ID | Caso |
|---|---|
| C01 | 15 claves de edToRow cubiertas |
| C02 | 12 claves leídas por edFromRow cubiertas |
| C03 | marca/modelo no rehidratados |
| C04 | IDs Number y max+1 con riesgo de colisión |
| C05 | categoría texto y futuro mapeo estable |
| C06 | cinco fotos principales y por color |
| C07 | JSON de colores name/qty/photos/hex |
| C08 | variante UUID estable futura |
| C09 | stock propio por suma de colores |
| C10 | proveedor cantidad=0 sin stock |
| C11 | alias privado principal-only |
| C12 | cola POST/PATCH no atómica |
| C13 | DELETE frente a snapshots de pedidos |
| C14 | RLS y privilegios por rol |
| C15 | cutover y reversión sin perder historia |
| C16 | pedidos reales desactivados |

**Reversión:** revertir exclusivamente commits documentales. Ninguna migración ni cambio de datos fue aplicado. En futura implementación: copia de seguridad, conciliación, despliegue por fases, detener escrituras ante discrepancias, preservar snapshots y ledger append-only. **NO-GO** para SQL, producción, servicios y pedidos reales.
