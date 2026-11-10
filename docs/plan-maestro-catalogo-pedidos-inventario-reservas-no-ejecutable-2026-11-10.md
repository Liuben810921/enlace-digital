# Plan maestro único de catálogo, pedidos, variantes, inventario y reservas — NO EJECUTABLE

Fecha: 2026-11-10. Base autorizada: `5d03e746cab6239188f594da3fec6da07d895aa5`. **Fuente normativa documental para próximas propuestas**; los borradores históricos siguen siendo referencias, **NO scripts para ejecutar conjuntamente**. Esta etapa es exclusivamente GitHub offline. **NO-GO** para SQL, migraciones, Supabase, producción, despliegues, correos, servicios y pedidos reales.

## 0. Estado observado y alcance
- Auditoría anterior de solo lectura de staging: existen `clientes_oficiales`, `clientes_destinatarios`, `clientes_direcciones_entrega`; faltan `productos`, `pedidos_oficiales`, `inventario_variantes`, `inventario_reservas`, `inventario_movimientos`. `clientes_oficiales.numero integer/int4`; destinatarios/direcciones tienen `id bigint/int8`. El metadato de privilegios directos de `service_role` sobre `clientes_oficiales` fue negativo, sin probar comportamiento RPC.
- Contrato exacto del frontend: `edToRow` emite **15 campos**: `id,nombre,marca,modelo,descripcion,categoria,precio_usd,cantidad,disponible,imagenes,especificaciones,origen_producto,archivado,variantes_color,updated_at`. `edFromRow` no rehidrata `marca`, `modelo` ni `updated_at`.
- La tienda usa `id:Number(p.id)` y crea nuevos IDs con `Math.max(...ids)+1`; `categoria` es texto; `imagenes` y `variantes_color` son JSON; `__freeShipping` y `__condition` residen en `especificaciones`.
- El alias de proveedor está separado en `productos_proveedores_privados`, visible en UI únicamente para `principal`. El checkout real permanece desactivado mediante `ED_REAL_CHECKOUT_ENABLED=false`.

## 1. Resoluciones canónicas de contradicciones
| Tema | Decisión documental unificada | Diferencia frente a borradores |
|---|---|---|
| Catálogo | Contrato **completo de 15 columnas** del serializador, no solo esquema mínimo | `staging_catalogo_pedidos_esquema_minimo_no_ejecutar.sql` es insuficiente para desplegar |
| ID producto | `bigint` **propuesto, no verificado**; preservar IDs heredados, usar identidad generada en servidor y verificar `Number.MAX_SAFE_INTEGER` | El `max+1` del navegador no es seguro con administradores concurrentes |
| ID cliente | `cliente_numero integer` con FK restrictiva a `clientes_oficiales(numero)` | No asumir `bigint` para clientes |
| ID pedido | `bigint` propuesto y FK de reservas solo tras crear pedidos | No aplicar FK a tablas ausentes |
| Colores | `variantes_color` JSON temporal `name,qty,photos,hex?`; UUID `variant_id` inmutable en tabla separada | El nombre de color no es identidad |
| Stock propio | `stock_fisico` y `stock_reservado`, disponible = físico − reservado; `cantidad` legacy derivada en transacción o solo lectura | No doble descuento físico al reservar y consumir |
| Proveedor | `cantidad=0` legacy y `qty=null` UI; confirmación por línea de pedido, **sin reserva de stock propio** | Ni agotado por cero ni disponibilidad ilimitada |
| Idempotencia de pedido | `UNIQUE(cliente_numero,idempotency_key)` más `request_sha256` para rechazar replay con otro payload | Sustituye propuesta anterior de clave global sin contexto |
| Idempotencia de movimiento | Identidad de **operación lógica** única por transición y reserva, con eventos separados por fase | `UNIQUE(idempotency_key,tipo,variant_id)` es preliminar e insuficiente sin contrato de operación |
| Ítems | `pedidos_oficiales_items` con snapshot de precio, nombre, color, origen, atributos y `variant_id` nullable en transición | Borrador antiguo sin UUID ni versión queda supersedido |
| Dirección | FK a cliente; IDs de destinatario/dirección **opcionales como procedencia**, snapshot inmutable | No obligar destinatario al registro ni FK a receptor creado durante compra |
| Categorías | `categoria text` compatible al inicio; tabla de departamentos con UUID solo tras mapeo de nombres/renombres | No introducir FK inexistente |
| Fotos | JSON de URLs y hasta cinco imágenes por producto/color; validar Storage y fallos parciales | Subir objetos y guardar fila no es transacción única |
| Borrado | Archivar preferido; FK `RESTRICT` y snapshots preservan pedidos; DELETE físico requiere reglas explícitas | No CASCADE histórico |
| Permisos | RLS + grants mínimos y RPC backend restringida; supervisor solo lectura; `principal` puede gestionar alias privado | La condición UI no reemplaza seguridad SQL |

## 2. Fases y dependencias (todas FUTURAS, requieren autorización específica)
**F0 — Preflight y aprobación de contratos.** Verificar tipos reales de catálogo/origen, IDs seguros, campos `edFromRow/edToRow`, departamentos, Storage, políticas/RPC y permisos; resolver tipo `producto_id`, modelo de proveedor, expiración y momento de consumo. Puerta: cero discrepancias de contrato sin decisión documentada.

**F1 — Catálogo compatible.** Proponer `productos` con 15 columnas, constraints de JSON y precios, `productos_proveedores_privados` con permisos separados; importar datos únicamente tras autorización y conciliación. Puerta: roundtrip sin pérdida de fotos, condición, envío gratis, marca/modelo ni categorías; IDs estables.

**F2 — Pedidos oficiales y snapshots.** Crear `pedidos_oficiales`, `pedidos_oficiales_items`, `pedidos_oficiales_estados`; FK cliente `integer`, idempotencia por cliente y hash, snapshot de entrega/ítems, estados append-only y restricciones de borrado. Puerta: historial inmutable y permisos por rol.

**F3 — Variantes e inventario.** Crear `inventario_variantes` con `variant_id uuid`, variante sintética para propio sin color, `stock_fisico`, `stock_reservado`, `version`; mapear JSON legacy sin duplicados Unicode y sin discrepancias de cantidad. Proveedor sin stock propio. Puerta: conciliación por producto y variante, `0 <= reservado <= fisico`.

**F4 — Reservas y auditoría.** Crear `inventario_reservas`, `inventario_movimientos` append-only, confirmaciones por línea de proveedor, operaciones idempotentes y bloqueos en orden determinista. Reservar: +reservado; consumir: −reservado y −físico; cancelar antes de consumo: −reservado una vez; tras consumo: devolución auditada, nunca reposición automática. Puerta: invariantes transaccionales y ningún evento duplicado.

**F5 — Pruebas aisladas staging.** Requerir autorización aparte para DDL/SQL y pruebas: permisos, RLS, concurrencia de última unidad, cancelaciones dobles, expiración vs consumo, reintentos, rollback multiítem, fallo de Storage, snapshots tras archivar, proveedor sin stock y acceso supervisor. No usar clientes ni pedidos reales. Puerta: todas las aserciones aprobadas y plan de recuperación verificado.

**F6 — Cutover futuro separado.** Requiere autorización nueva: congelar escritor legacy, reconciliar reservas y existencias, activar autoridad única de backend, observar métricas y verificar apagado seguro. **No se autoriza activar pedidos reales, correos ni producción con este plan.**

## 3. Riesgos y criterios de aceptación
- **P0:** staging sin tablas catálogo/pedidos; F1 y F2 son prerrequisitos para F3/F4. Sin DDL permitido ahora.
- **P0:** discrepancias de stock por color, IDs no seguros, nombres duplicados o faltas de FK: bloquear backfill; nunca ajustar silenciosamente.
- **P0:** reservas hechas desde navegador sin bloqueo transaccional: no admitir ventas reales.
- **P1:** `marca/modelo` pueden perderse en roundtrip; `imagenes` y fotos por color pueden quedar huérfanas si Storage/POST falla.
- **P1:** `service_role` sin grants directos de tabla de clientes observado en auditoría previa; validar rutas RPC y no ampliar permisos automáticamente.
- **P1:** `deleteProductForever` debe bloquearse ante historia referenciada; snapshots no se alteran.
- **P1:** política de expiración, instante de consumo, devolución y proveedor requiere decisión antes de SQL ejecutable.
- **Aceptación documental:** los 15 campos, dependencias F0–F6, decisiones canónicas, límites de privilegios, matriz de pruebas y reversión deben pasar CI offline. Esto **no demuestra** integridad de datos ni ausencia de carreras en base de datos.

## 4. Matriz de aceptación / pruebas
| ID | Comprobación |
|---|---|
| U01 | 15 columnas de serializador representadas |
| U02 | Cliente integer y pedidos bigint documentados |
| U03 | FKs solo después de tablas destino |
| U04 | UUID estable y renombre de color sin cambiar historial |
| U05 | JSON legacy reconciliado sin perder fotos |
| U06 | Stock propio con reserva y consumo una vez |
| U07 | Proveedor sin stock ficticio |
| U08 | Snapshot de receptor y dirección inmutable |
| U09 | Idempotencia de pedido por cliente y hash |
| U10 | Idempotencia de transición y ledger append-only |
| U11 | Última unidad con dos compras concurrentes |
| U12 | Doble cancelación y expiración simultánea |
| U13 | Archivar/eliminar sin perder pedidos |
| U14 | RLS, RPC y roles supervisor/principal |
| U15 | Reconciliación de marcas/modelos, categorías y Storage |
| U16 | Reversión antes/después del cutover |
| U17 | Pedidos reales desactivados |
| U18 | Solo documentación y pruebas estáticas en esta etapa |

## 5. Reversión y precedencia
**Ahora:** revertir commits de documentos/scripts/CI sin tocar datos. **Antes del futuro cutover:** respaldar, detener pruebas, retirar objetos nuevos solo si no contienen historia y tras autorización. **Después del cutover:** deshabilitar escrituras, conservar pedidos, reservas y ledger, conciliar y registrar movimientos compensatorios; nunca DROP histórico ni reactivar escritor legacy mientras existan reservas.

**Precedencia:** este plan maestro prevalece **solo como criterio documental** sobre borradores previos cuando difieran. No modifica ni autoriza la ejecución de sus SQL. Referencias: `docs/auditoria-contrato-completo-catalogo-staging-2026-11-10.md`, `docs/contrato-minimo-catalogo-pedidos-staging-no-ejecutar-2026-11-10.md`, `docs/plan-migracion-inventario-reservas-staging-no-ejecutar-2026-11-10.md`, `docs/diseno-unificado-inventario-reservas-no-ejecutable-2026-11-09.md`.

**NO-GO:** no ejecutar SQL, no modificar Supabase ni producción, no cambiar código operativo, no desplegar, no activar servicios, correos ni pedidos reales.
