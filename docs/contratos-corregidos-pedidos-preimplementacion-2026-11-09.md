# Contratos corregidos para pedidos oficiales — 2026-11-09

**Borrador offline; NO ejecutable ni implementado.** Base `c8f6ef3a4a3c7e803ded0df2f20b6d6ec50ee4a0`. El SQL propuesto está íntegramente comentado. No modificar Supabase ni activar pedidos.

## Ajustes realizados al diseño
- **Dirección:** `entrega_direccion` es el texto completo, congelado y compatible con el SELECT actual del panel administrativo; `entrega_calle_detalle` conserva el detalle original, junto a provincia/municipio/barrio. Evitar duplicación incoherente: generar la dirección completa en el servidor mediante una función de formato única.
- **Producto:** `producto_id_origen bigint` para reflejar `productos.id` numérico; es una referencia histórica opcional, sin borrado en cascada. Nombre, variante, atributos, precio y origen quedan copiados en `pedidos_oficiales_items`.
- **Precios:** servidor consulta `productos.precio_usd`, `disponible`, `archivado`, `variantes_color` y `origen_producto` en transacción. `numeric(14,2)`, importe de línea = precio unitario × cantidad y subtotal = suma de líneas; no aceptar precios del navegador. Capturar moneda USD y tasa de cambio para pagos CUP.
- **Stock propio:** bloquear fila de producto, validar stock global o por color, decrementar una sola vez con clave idempotente y transacción; definir restauración de stock en cancelación antes de implementar.
- **Proveedor:** `cantidad=0` en la fila persistida no significa agotado ni stock ilimitado. Validar `disponible` y color; la confirmación con proveedor requiere regla de negocio explícita. No descontar inventario ficticio.
- **Mensajería:** cargo en CUP separado del total de productos USD, registrar promoción de mensajería gratis, coste interno y tasa si se utiliza. El borrador aún requiere definir coste interno si el negocio lo desea.
- **Estados:** evento append-only para cada transición; `estado` de cabecera es proyección, solo cambia por RPC transaccional. `pago_estado` independiente de estado logístico, con `pago_metodo` restringido a efectivo CUP, efectivo USD y Zelle.
- **Roles:** propuesta de matriz: Principal administración completa; General gestión operativa de pedidos y lectura autorizada; Supervisor **solo lectura**; Operativo limitado a tareas asignadas. La tabla `departamentos_admins` y el rol `operativo` requieren verificación de políticas servidor. No deducir permisos del frontend; la UI actual `edVerify` comprueba pertenencia pero no garantiza autorización por acción.
- **Ruta Edge:** el HTML usa `/functions/v1/enlace-cliente-auth` mientras el código auditado está en `enlace-cliente-auth-staging`; discrepancia bloqueante para futuras pruebas HTTP hasta confirmar despliegue/alias. No cambiar endpoint ahora.

## Riesgos y bloqueos que siguen abiertos
1. SQL comentado no incluye aún RPC final, triggers de inmutabilidad, índices, RLS ni política de lectura administrativa; no es migración ejecutable.
2. La fuente de verdad de stock por color, reservas simultáneas, pago y cancelación requiere diseño transaccional probado.
3. La pantalla de clientes usa `Promise.all` para `clientes_oficiales`, `clientes_destinatarios`, `pedidos_oficiales`; si la última tabla falta o está denegada, falla el panel completo. Futura solución: RPC/vista administrativa autorizada y gestión de error por sección.
4. El borrador contiene una propuesta de matriz de roles, no concesiones verificadas en DB.
5. El contrato de snapshots debe preservar historial sin permitir UPDATE/DELETE, pero retención/privacidad requieren política formal.
6. GitHub Actions existentes prueban autenticación y aislamiento, no crean ni verifican pedidos reales.

## Pruebas estáticas y aceptación
El script `scripts/check_orders_design_contract.py` debe comprobar offline: todas las líneas SQL comentadas, columnas REST requeridas, `bigint` para ID de producto, snapshot completo, estado/eventos, pagos, stock propio/proveedor, `ED_REAL_CHECKOUT_ENABLED=false`, confirmación simulada y la diferencia de endpoint (marcada como bloqueo conocido, no aprobación). No requiere credenciales ni conexión.

**NO-GO** para ejecución SQL, despliegue o pedidos. La reversión de este paso es solo revertir commits documentales; no hay datos ni servicios que revertir.
