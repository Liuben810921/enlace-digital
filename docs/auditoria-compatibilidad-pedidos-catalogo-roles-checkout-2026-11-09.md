# Contratos de catálogo, stock, roles y checkout para pedidos — 2026-11-09

**Auditoría offline, no implementación.** Base `ea9d05731c0e5d4dbd414c3454fc3e4ce0e28042`. No ejecutar SQL ni desplegar. Fuente: `staging-preview/index.html`, propuesta `sql/propuestas/staging_pedidos_oficiales_snapshot_no_ejecutar.sql` y workflow.

## Evidencia y diferencias
- Productos: `edLoadInventory()` lee `/rest/v1/productos?select=*&order=id.asc`. `edFromRow()` convierte `id` a número, `precio_usd` a Number, `cantidad` a `qty`, `origen_producto='proveedor'` a `qty=null`, y conserva `variantes_color`, `disponible` y `archivado`. El precio mostrado por navegador NO es fuente de confianza para pedidos.
- `edToRow()` guarda `precio_usd`, `cantidad` (0 para proveedor), `variantes_color`, `disponible`, `archivado`. La futura RPC debe leer filas oficiales y aplicar reglas de stock propias/proveedor. Las variantes pueden requerir validación de cantidades por color. No asumir inventario ilimitado de proveedor ni reservar stock sin política definida.
- `edOfficialRecipientCheckout()` calcula `total` en cliente, muestra vista previa y `edConfirmSimulatedCheckout()` no registra nada. `ED_REAL_CHECKOUT_ENABLED=false`. Una RPC futura deberá recalcular precios y validar disponibilidad en una transacción con bloqueo de filas/idempotencia.
- `edVerify()` valida usuario Supabase Auth y consulta `departamentos_admins` por `user_id`; usa `enabled` y `role`. Los roles visibles en UI incluyen `supervisor`, `operativo`, `general`; la lógica de control actual no demuestra que supervisor sea solo lectura en cada consulta. Propuesta: lectura de pedidos solo mediante RPC/vista administrativa con autorización servidor por acción y rol, no por un booleano del frontend. El acceso a `clientes_oficiales` y `clientes_destinatarios` debe revisarse junto con pedidos.
- La pantalla administrativa llama a `/rest/v1/pedidos_oficiales` con campos `id,cliente_numero,destinatario_nombre,entrega_direccion,total_usd,estado,creado_en`. **Incompatibilidad concreta:** el borrador de pedidos separa `entrega_provincia`, `entrega_municipio`, `entrega_barrio`, `entrega_direccion` y no define `entrega_direccion` como texto completo. Antes de desplegar, definir una columna de dirección completa o una vista segura de compatibilidad. No usar concatenación ambigua sin reglas de formato.
- `producto_id_origen text` en la propuesta puede representar IDs numéricos existentes como texto, pero una clave tipada y validación del ID de catálogo son preferibles; la copia histórica debe seguir independiente de bajas/cambios del catálogo.
- La propuesta de estados tiene cabecera mutable y eventos append-only: el backend debe asegurar atomicidad, transiciones permitidas y correspondencia entre proyección y último evento. No admitir escritura directa de estado desde navegador.
- El flujo de pagos/mensajería separa productos USD y entrega CUP. Capturar tipo de cambio y condiciones de pago como snapshot, pero confirmar reglas vigentes antes de implementar.
- La URL del portal de clientes en el HTML apunta a `/functions/v1/enlace-cliente-auth`, mientras el controlador bajo auditoría se llama `enlace-cliente-auth-staging`. **Diferencia de endpoint** que exige contrato de entorno y corrección futura antes de pruebas HTTP. No modificar URL ahora.

## Contratos pendientes y propuesta de resolución
1. **Precio/stock:** contrato de servidor para cada item `{producto_id, variante_color, cantidad}`; resolver nombre, origen, precio y disponibilidad desde DB en la misma transacción. Para propio, bloquear filas y reservar/descontar según regla aprobada; para proveedor, exigir política de confirmación y no inventar stock.
2. **Dirección histórica:** añadir campo `entrega_direccion` completo o vista administrativa protegida que preserve el nombre de columna esperado; mantener campos desglosados y snapshot inmutable.
3. **Permisos:** tabla de capacidades por rol (Principal/General/Operativo/Supervisor), con supervisor estrictamente lectura y pruebas de denegación de mutaciones; no basarse en UI.
4. **Creación:** nueva RPC/Edge autenticada, validación de cliente, destinatario, dirección, idempotencia, precio, stock y snapshot; sin habilitar pedidos.
5. **Integridad:** `subtotal_usd = SUM(items.importe_usd)` y `importe_usd = cantidad * precio_unitario_usd` bajo aritmética decimal exacta, sin floats de JS como autoridad.

## Casos estáticos reproducibles (offline; NO ejecutar integración)
- S01: el borrador SQL es solo comentarios; ninguna línea SQL ejecutable.
- S02: las siete columnas que consume el panel administrativo existen en tabla o vista compatible; **FAIL actual** por `entrega_direccion` ausente.
- S03: el modelo conserva nombre, teléfono, provincia, municipio, barrio, dirección, ítems, precio unitario, cantidad, estado y eventos.
- S04: la creación de pedidos reales permanece desactivada y `edConfirmSimulatedCheckout` no escribe en backend.
- S05: los productos se cargan desde `productos`; ninguna fuente de precio del navegador debe ser autorizada por diseño.
- S06: control de roles se efectúa en servidor, supervisor sin mutaciones; **PENDIENTE** implementación y pruebas.
- S07: política de stock propio/proveedor/color e idempotencia definida; **PENDIENTE** decisión de negocio.
- S08: endpoint de Edge staging consistente con UI; **FAIL actual** por diferencia de ruta, sin prueba de despliegue.
- S09: no se modifica ningún archivo de producción, ni se ejecuta SQL o HTTP.
- S10: un cambio en destinatario o precio posterior no altera snapshot; **PENDIENTE** prueba de integración futura.

## CI verificado
Commit base `ea9d05731c0e5d4dbd414c3454fc3e4ce0e28042`: GitHub Actions `42730189096`, `completed/success`. El workflow existente valida contratos de autenticación y aislamiento, **no** los contratos de pedidos. No presentar este éxito como aprobación de pedidos.

## Riesgos, aceptación y reversión
No desplegar ni crear tablas hasta resolver dirección compatible, backend de precio/stock, permisos administrativos y ruta Edge. La propuesta SQL sigue inerte. Si en el futuro se autoriza migración, capturar ACL/esquema, probar con fixtures ficticios, no borrar historial para revertir, preservar idempotencia y tener rollback de código/flags separado de datos. `nextval()` no se revierte. La reversión de cambios futuros requerirá aprobación específica.
