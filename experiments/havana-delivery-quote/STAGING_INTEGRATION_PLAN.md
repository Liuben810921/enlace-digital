# Integración de Administración de entregas con staging existente

Estado: PREPARADO EN GITHUB; NO APLICADO. Proyecto exclusivo: xqahthghvozeigbojhyi.
No modificar producción (ubrvuplslconfxwpfzxj). No crear nueva demo ni desplegar.

## Inventario de código existente
- index.html usa ED_URL de producción y ED_KEY pública de producción. No cambiar esas constantes globales para staging: afectarían autenticación y demás API.
- Administración de entregas persiste por localStorage: ED_DELIVERY_SUPPLIERS_KEY, ED_DELIVERY_ORIGINS_KEY (almacenes), ED_PRODUCT_ORIGINS_KEY (asociaciones), ED_DELIVERY_DESTINATIONS_KEY y ED_DELIVERY_DRAFT_KEY.
- Guardado de borradores comprueba revisiones locales, pero no ofrece transacción entre navegadores.
- Cotización vial auténtica: PENDIENTE; no representar kilómetros o precios simulados como reales.
- staging tiene tablas de clientes y RPC de autenticación, pero no tablas de proveedores/almacenes/entregas ni Edge Functions.

## Contrato mínimo propuesto de persistencia (no ejecutado)
Crear un esquema privado ed_delivery_staging, fuera de los esquemas expuestos por Data API, con:
1. suppliers: id UUID PK, name, active, payload JSONB, revision BIGINT, updated_at.
2. warehouses: id UUID PK, supplier_id UUID FK nullable, name, active, payload JSONB, revision, updated_at.
3. product_origins: product_id TEXT, warehouse_id UUID FK, supplier_id UUID FK nullable, payload JSONB, revision, PK (product_id, warehouse_id); FK y comprobaciones de coherencia.
4. destinations: id UUID PK, name, municipality, address, coordinates opcionales, payload JSONB, revision, updated_at.
5. shipment_drafts: id UUID PK, status, payload JSONB, revision, updated_at; referencias a productos, orígenes y destinos validadas en transacción.
6. operation_log: operation_id UUID PK, actor, operation, payload_hash, result, created_at; idempotencia por operación.

Requisitos antes de aplicar: revisar nombres/campos exactos de los objetos existentes; definir actor administrativo de staging y mecanismo de sesión verificable. No conceder acceso directo a anon ni habilitar RLS permisiva. Mantener RLS habilitada en tablas, permisos mínimos y evitar SECURITY DEFINER con propietario privilegiado/BYPASSRLS. La API de escritura debe validar actor, referencias, revisiones e idempotencia en una sola transacción PostgreSQL. Rechazar conflictos de versión; no sobrescribir datos por último escritor.

## Conexión web mínima
- Mantener index.html existente; no reemplazarlo por un prototipo.
- Configuración aislada de staging solo para Administración de entregas; jamás sustituir ED_URL global de producción.
- Adaptador asíncrono para leer/guardar suppliers, warehouses, product_origins, destinations y shipment_drafts con API autenticada; la UI debe esperar confirmación antes de mostrar guardado.
- Bloquear escrituras cuando no exista sesión administrativa staging verificada, cuando la API falle o cuando falte versión de entidad.
- No sincronizar automáticamente datos locales históricos ni clientes reales; inicializar solo registros ficticios mediante autorización específica.
- No activar pedidos reales ni cobros. Mantener mensajería y distancias viales como PENDIENTE.

## Secuencia de autorizaciones
A. Aprobar exclusivamente creación de esquema/tablas/roles/RPC de staging y sus verificaciones focalizadas, tras presentar SQL exacto y mecanismo de autorización.
B. Aprobar conexión de página de pruebas existente al staging, en URL aislada y accesible por teléfono, tras validar que no toca producción.
C. Probar alta/edición/reasignación/archivo con datos ficticios, y posteriormente cartografía real solo con autorización separada.

## Riesgos y bloqueo actual
La identidad administrativa de la página utiliza un flujo distinto de las RPC de clientes del staging. Sin definir una credencial administrativa segura y verificable no existe una integración de escritura apta para desplegar. Un endpoint público con clave publishable no autoriza por sí mismo a administrar proveedores, almacenes e inventario. No desplegar hasta resolverlo.
