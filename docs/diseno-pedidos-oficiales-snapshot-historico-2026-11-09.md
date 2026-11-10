# Diseño de pedidos oficiales y snapshot histórico — 2026-11-09

**Solo diseño offline. No ejecutado.** Proyecto futuro staging `xqahthghvozeigbojhyi`; no modificar producción. Propuesta SQL íntegramente comentada: `sql/propuestas/staging_pedidos_oficiales_snapshot_no_ejecutar.sql`.

## Contratos comprobados
- La interfaz `staging-preview/index.html` consulta `/rest/v1/pedidos_oficiales?select=id,cliente_numero,destinatario_nombre,entrega_direccion,total_usd,estado,creado_en`. Esas columnas deben conservarse para compatibilidad.
- Checkout oficial actual solo prepara una vista previa y `edConfirmSimulatedCheckout()` confirma **sin crear pedidos**; `ED_REAL_CHECKOUT_ENABLED=false`. Se requerirá una API de creación de pedido nueva, no basta con crear una tabla.
- Edge staging dispone de autenticación y operaciones de destinatarios/direcciones, pero **no** de creación o transición de pedidos.
- El esquema v4 declara explícitamente que el historial de pedidos es una propuesta futura. Catálogo staging consultado previamente confirma ausencia de `public.pedidos_oficiales`.

## Modelo propuesto
1. `pedidos_oficiales`: ID, `cliente_numero` FK RESTRICT, idempotency key única, identificadores de origen opcionales, **copia independiente** de nombre/teléfono del destinatario y provincia/municipio/barrio/dirección/referencias; subtotal y total USD, mensajería CUP separada, tasa de cambio capturada, método de pago, estado proyectado, marcas temporales.
2. `pedidos_oficiales_items`: pedido FK RESTRICT, ID de producto de origen opcional, nombre, color, cantidad, precio unitario USD, importe USD y atributos JSONB congelados. No consultar catálogo vivo para reconstruir importes históricos.
3. `pedidos_oficiales_estados`: registro append-only de transición, actor, motivo y fecha. `estado` en cabecera es proyección compatible con UI, **no** un campo libremente editable; transiciones solo mediante RPC restringida y auditada.

El snapshot de entrega y líneas debe conservarse aunque el cliente edite destinatarios, cambien productos/precios o se archive un producto. El estado **no es literalmente inmutable**: su historia es inmutable y el estado actual cambia de forma controlada y trazable.

## Seguridad y contratos
- Todas las tablas con RLS, sin grants directos a `anon`/`authenticated`; minimizar grants a `service_role`. RPC SECURITY DEFINER con search_path fijo, autenticación y autorización explícita, privilegios EXECUTE limitados, validación de transiciones, controles de concurrencia y protección contra borrado.
- **No confiar en importes enviados por navegador**: resolver precios, stock, producto y color en servidor y crear cabecera + ítems + primer evento de forma atómica. Idempotency key por intento para evitar duplicados; impedir doble descuento de stock. Definir política para productos de proveedores sin stock propio.
- La lectura administrativa actual mediante REST necesita revisar JWT/rol administrativo, políticas/grants y el esquema de administración existente. No conceder SELECT público para hacer funcionar la pantalla. Puede requerir vista/RPC administrativa específica y ajuste de la interfaz.
- Los datos personales de entrega deben tener retención, acceso limitado, minimización, auditoría y política de eliminación/anominización legalmente aprobada; inmutabilidad comercial no equivale a retención indefinida.
- FK a cliente `ON DELETE RESTRICT` protege historia; los ID de destinatario/dirección son referencias informativas, sin FK obligatoria a registros editables. Prohibir UPDATE/DELETE de snapshots y líneas mediante privilegios y protecciones en DB (a diseñar y probar). Superusuarios/owners siguen siendo excepción de confianza.
- Montos `numeric` con dos decimales y moneda explícita; mensajería en CUP no integra total USD, conforme al contrato actual. Tasa CUP/USD y método se conservan como hechos históricos.

## Migración futura, fases sujetas a autorización independiente
A. Preflight read-only: proyecto, tablas, roles, catálogo de productos, autenticación administrativa, pedidos existentes, respaldos, coste, inventario de consumidores.
B. Revisar esquema con DBA; resolver estructura de producto/stock, estados permitidos, descuentos, IVA si aplica, pagos y política de datos.
C. Aprobar y aplicar DDL exclusivamente staging con plan de reversión, RLS/grants, RPC y triggers; **no** activar pedidos.
D. Tests de transacciones e idempotencia con datos ficticios, incluyendo rollback y secuencias identity no transaccionales.
E. Integrar API/Edge y UI en rama aislada; ejecutar mocks offline, CI, después pruebas HTTP controladas con aprobación separada.
F. Activación de pedidos reales solo por aprobación explícita posterior y controles de operación/costes.

## Pruebas de aceptación futuras
- Crear pedido ficticio: cliente/propietario autenticado, líneas y precios validados servidor, importe exacto, estado inicial registrado; sin emails ni cobros.
- Duplicar la misma idempotency key: devuelve el mismo pedido, sin duplicar líneas ni reservar dos veces stock.
- Editar destinatario, dirección y precio del catálogo: snapshots del pedido sin cambios.
- Intentar UPDATE/DELETE de snapshot e ítems con roles no autorizados: denegado.
- Transición de estado autorizada: nuevo evento append-only y proyección actual coherente; transición ilegal, replay y actor no autorizado rechazados.
- Consulta administrativa: solo rol autorizado, filtrado y paginación; cliente A no lee pedido de B.
- Fallo de una línea: rollback de cabecera/ítems/eventos, salvo avance de secuencias; sin pedidos huérfanos.
- Confirmar ausencia de pedidos/correos reales y de efectos en producción.

## Riesgos y reversión
- **Bloqueos:** no existe `pedidos_oficiales` en staging; falta API de creación de pedidos y contrato de autenticación administrativa para leerlos. No está validada la fuente autoritativa de precio/inventario ni el ciclo de estados.
- El SQL propuesto es un **borrador de estructura**, no una migración lista para ejecutar: faltan DDL final de RLS, índices, triggers, RPC, contratos de stock y autorización.
- Reversión futura: antes de DDL capturar ACL/esquema y respaldos; en staging vacío podría revertirse un despliegue autorizado mediante DROP solo si se confirma ausencia de datos y dependencias y se aprueba expresamente. **Nunca eliminar pedidos históricos existentes como rollback automático**. Revertir código/flags sin borrar registros y conservar eventos.
- `nextval()` no se revierte por ROLLBACK. No reiniciar secuencias sin aprobación.
- Ninguna modificación de Supabase, producción, correos, pagos o pedidos fue autorizada ni realizada en esta fase.

## Estado
**Diseño documentado, no implementado.** Siguiente paso seguro: revisión offline de coherencia del esquema y contratos, especialmente autorización administrativa y fuente de precios/stock, antes de proponer DDL ejecutable.
