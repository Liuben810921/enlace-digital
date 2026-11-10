# Matriz de preflight de migraciones de Supabase staging — NO EJECUTABLE

Fecha: 2026-11-10. Base autorizada: `7f78a0541cf90b8b605f0d5a22e7f994d2cfaf40`. Alcance: **documentación y pruebas estáticas offline exclusivamente en GitHub**. No se ejecutó SQL ni se consultó Supabase durante esta etapa. Esta matriz es un protocolo de inspección futura, **no un resultado nuevo de base de datos**. Documento rector: `docs/especificacion-unica-migraciones-staging-no-ejecutable-2026-11-10.md`.

## Evidencia histórica y límites
La auditoría anterior de staging documentó únicamente `public.clientes_oficiales`, `public.clientes_destinatarios` y `public.clientes_direcciones_entrega`, con RLS activado; no encontró `public.productos`, `public.pedidos_oficiales`, `public.pedidos_oficiales_items`, `public.inventario_variantes`, `public.inventario_reservas` ni `public.inventario_movimientos`. `clientes_oficiales.numero` era `integer/int4`; los ID de destinatarios/direcciones, `bigint/int8`. Se reportó falta de privilegios directos de `service_role` sobre `clientes_oficiales`, sin concluir fallos de RPC. **Estas observaciones no se han vuelto a verificar**. Las comprobaciones de datos de catálogo, variantes y stock son pendientes, no aprobadas.

## Matriz de inspecciones futuras (solo propuestas, no ejecutadas)
| ID | Objeto y vía de inspección futura | Resultado esperado / criterio PASS | Bloqueo NO-GO |
|---|---|---|---|
| P01 | Identidad del proyecto, entorno y permisos administrativos | Staging inequívoco, cuenta y rol autorizados; producción fuera de alcance | Proyecto ambiguo o permisos insuficientes |
| P02 | Inventario de tablas `information_schema.tables` / `pg_catalog.pg_class` | Existencia o ausencia documentada por fase G00–G09; no asumir tablas | Dependencia faltante antes de aplicar fase |
| P03 | Columnas, nulabilidad, defaults y tipos `information_schema.columns` | 15 campos `edToRow` conciliados; JSONB, numeric y timestamptz compatibles | Columna o tipo discrepante, pérdida de marca/modelo |
| P04 | PK, FK, UNIQUE y CHECK `pg_constraint` | FK cliente `integer`; producto/pedido ID del mismo tipo que sus referencias; RESTRICT histórico | FK huérfana, ID inseguro en JS o constraint ausente |
| P05 | RLS `pg_class.relrowsecurity` y políticas `pg_policies` | RLS activo, políticas explícitas por tabla/rol, acceso mínimo | Política abierta, bypass no justificado |
| P06 | Grants `information_schema.role_table_grants`, `has_table_privilege` y EXECUTE | `anon` y `authenticated` sin escrituras directas críticas; RPC restringidas | Grant amplio, `service_role`/RPC no resueltos |
| P07 | Funciones `pg_proc`, SECURITY DEFINER y `search_path` | Identidad/propiedad validadas, search_path fijo y EXECUTE limitado | Definer expuesto o función sin control de propietario |
| P08 | Clientes, destinatarios y direcciones (metadatos y FK, sin PII) | `clientes_oficiales.numero integer`; `cliente_numero integer`; ID dependientes bigint | FK o pertenencia inconsistente |
| P09 | Catálogo `productos`: esquema y 15 campos de serialización | Fotos, especificaciones, `__condition`, `__freeShipping`, categoría y alias preservados | Campo faltante o conversión destructiva |
| P10 | Identificadores legacy y generación de ID | IDs únicos y `Number.MAX_SAFE_INTEGER`; asignación en servidor | Colisiones `max+1`, remapeo sin conciliación |
| P11 | Categorías/departamentos y renombres | `categoria text` compatible o mapeo estable sin pérdida | Nombre duplicado o FK prematura |
| P12 | Fotos/Storage y permisos de objeto | URLs/objetos reconciliados, máximo 5 por producto/color según contrato | Fotos huérfanas o permisos públicos indebidos |
| P13 | JSON `variantes_color`: `name,qty,photos,hex?` | Array válido, nombres normalizados únicos por producto, qty entero no negativo | Duplicados Unicode, qty negativo o foto perdida |
| P14 | Stock propio `cantidad` y variantes | `cantidad = sum(qty)` si tiene colores; variante sintética sin color | Diferencia no conciliada o stock negativo |
| P15 | Productos de proveedor y alias privado | `cantidad=0` legacy, `disponible` independiente; alias solo principal | Stock ficticio o alias expuesto |
| P16 | Pedidos oficiales e ítems | FK cliente correcta, snapshots inmutables, precio USD, versión e idempotencia | Pedido sin propietario o snapshot mutable |
| P17 | Reservas y movimientos | UUID estable, `0 <= stock_reservado <= stock_fisico`, ledger append-only | Reserva sin variante, doble consumo o movimiento sin auditoría |
| P18 | Concurrencia, cancelaciones, expiración y reintentos | Pruebas aisladas autorizadas: última unidad, doble cancelación, rollback multítem | Sobreventa, liberación duplicada, reintento no idempotente |
| P19 | Control de flags y activación | `ED_REAL_CHECKOUT_ENABLED=false`, correos/servicios/pedidos reales apagados | Activación accidental o cambio de producción |
| P20 | Backups, reversión y puerta de fase | Snapshot autorizado, procedimiento de recuperación ensayado, firmas de aprobación | Sin recuperación, discrepancias sin resolver |

**Lectura de estado:** P01–P20 = `PENDIENTE` para la próxima comprobación autorizada. Los datos históricos descritos arriba no equivalen a PASS actual. Un resultado desconocido es **NO-GO**, nunca PASS por omisión.

## Orden de evaluación por fases
- **G00:** P01–P08, P19, P20; documentar esquema y permisos antes de proponer DDL.
- **G01:** P03, P04, P09–P12; catálogo completo y roundtrip no destructivo.
- **G02:** P05–P07, P11, P15; alias privado y departamentos.
- **G03–G04:** P04–P08, P16; clientes, pedidos, ítems y eventos.
- **G05:** P10, P13–P15, P17; variantes estables y conciliación de stock.
- **G06:** P16–P18; reservas, cancelaciones y movimientos.
- **G07:** P05–P07, P19; RLS y permisos finales.
- **G08:** P13–P20; pruebas funcionales aisladas **solo tras autorización nueva**.
- **G09:** P19–P20; cutover y reversión **solo tras autorización independiente**.

## Criterios de aceptación y seguridad
1. Todas las comprobaciones aplicables a una fase tienen evidencia fechada, procedencia y responsable; `PASS` solo después de inspección autorizada.
2. Ningún esquema, migración o prueba que escriba datos se ejecuta por efecto de esta matriz. Los tests CI únicamente validan presencia y consistencia documental.
3. No consultar PII, secretos ni producción para satisfacer esta matriz. Si en una etapa posterior se requieren datos de ejemplo, deben ser ficticios, aislados y autorizados.
4. Permisos de `anon`, `authenticated`, `service_role` y funciones `SECURITY DEFINER` requieren revisión por ruta efectiva, no solo grants de tabla.
5. Cualquier tipo `bigint` propuesto para producto/pedido queda sujeto a contraste real; `cliente_numero integer` es el contrato observado históricamente.
6. Las pruebas de concurrencia no pueden declararse superadas mediante lectura de documentación o simulaciones estáticas.

## Reversión y cierre
**Etapa actual:** revertir únicamente los commits documentales y de CI si se detecta error; no hay cambios de datos, esquema ni configuración que revertir. **Futuro staging:** exigir backup y restauración autorizados, detener escrituras, conservar snapshots de pedidos y ledger append-only, compensar movimientos en vez de borrarlos. **Producción:** fuera de alcance. **NO-GO** hasta autorización específica de la siguiente etapa.

**Prohibiciones:** no SQL ejecutado, no consulta a Supabase, no modificación de código operativo, no producción, no despliegue, no servicios, no correos, no pedidos reales.
