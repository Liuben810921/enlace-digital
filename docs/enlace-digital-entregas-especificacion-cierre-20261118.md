# ENLACE DIGITAL — Especificación mínima de cierre de Administración de entregas

Fecha: 2026-11-18. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base `a1010479a64d224bac3a62bdf4f1a96d1858365c`, comparación inicial GitHub: identical.

## Estado exacto de los contratos inspeccionados
- `experiments/havana-delivery-quote/integration.js`, SHA Git `7776a981eda835856485f7f31a5bd63473ffc079`, ofrece `validateConfiguration`, `updateConfiguration` y `adaptCheckoutDelivery`. Es puro y no persiste datos.
- `experiments/havana-delivery-quote/quote.js`, SHA Git `39f82bed45f7645b935e5951f559a68af27cdda9`, exige una ruta por origen elegible, revisión coincidente y `status:'verified'`; devuelve `COTIZACION_SIMULADA`, nunca un precio real certificado.
- Las 24 pruebas offline previas ya están documentadas y **no se repitieron**.

## 1. Persistencia compartida: contrato mínimo para implementación futura
Una única configuración empresarial versionada con `schemaVersion=1`, `revision` entera monotónica, `suppliers[]`, `origins[]` y `destinations[]`. Cada registro debe tener ID estable y los atributos que hoy valida `validateConfiguration`; los almacenes de proveedor deben referenciar proveedor existente. La ubicación (municipio, dirección y coordenadas opcionales) necesita validación adicional antes de pasar a datos operativos. Nunca trasladar directamente datos `*_demo_v1` a la base real.

**Operaciones propuestas:** `get_delivery_configuration()` solo lectura para personal autorizado; `update_delivery_configuration(expected_revision, next_configuration, operation_id)` escritura atómica para administradores autorizados. Comparar `expected_revision` bajo bloqueo transaccional; actualizar configuración y revisión en la misma transacción; ante conflicto devolver `CONFLICT` sin aplicar cambios. `operation_id` impide repetir una misma escritura tras reintentos. Una actualización de origen, proveedor, destino o tarifa debe invalidar toda cotización dependiente de la revisión anterior.

**Roles propuestos, pendientes de confirmación:** Principal y Administrador general pueden editar; Supervisor puede consultar, no editar. Gestores y clientes no acceden a configuración administrativa. El cotizador público solo debe recibir los datos mínimos necesarios, sin exponer direcciones privadas de almacenes ni información de proveedores. La autorización debe aplicarse en servidor (no confiar en botones ocultos). Auditar actor, operación, fecha y revisión, sin almacenar secretos en logs.

**No implementado ni ejecutado:** tablas, RPC, permisos, RLS, migraciones o cambios en Supabase. Estos son contratos propuestos, no garantías verificadas de una base real.

## 2. Contrato de distancias viales verificadas
Entrada por cada par de origen elegible y destino: `originId`, `destinationId`, `km`, `status`, `contextRevision`, más metadatos externos de trazabilidad: `routeEngine`, `mapDatasetVersion`, `computedAt` y `routeFingerprint`. La capa que verifica la ruta debe acreditar cobertura vial y procedencia antes de marcar `status:'verified'`; **no** basta con que un cliente envíe ese texto. Los metadatos de procedencia aún no son validados por `quote.js`.

Se exige una ruta vigente y única por origen elegible; si falta una, es inválida o está desactualizada, toda cotización queda `PENDIENTE`. Usar distancia vial, no distancia en línea recta. Elegir el origen más lejano, aplicar mínimo de 3 km, tarifa configurable en CUP/km o tarifa especial aprobada. Ningún valor ficticio o manual sin validación debe llegar al cobro.

**No implementado:** descarga de datos OSM, motor OSRM, cálculo real, validación de procedencia ni actualización cartográfica.

## 3. Integración final con checkout
1. Seleccionar destinatario y dirección confirmada; resolver un `destinationId` estable y su versión.
2. Leer configuración autorizada y su `revision`; seleccionar los almacenes asociados a los productos del carrito, no todos los almacenes globales. **Atención:** el adaptador experimental actual utiliza todos los orígenes de `configuration.origins`; por tanto, todavía no sirve para calcular un carrito real sin un filtro previo validado.
3. Obtener rutas verificadas para **todos** los orígenes elegibles de ese pedido; comprobar revisión de configuración, cesta, destino, tarifa y rutas.
4. Invocar adaptador de cotización; si hay `PENDIENTE`, mostrar «Tarifa de mensajería pendiente de confirmar» y no presentar un importe calculado como definitivo.
5. Si existe cotización válida, presentar **Mensajería: X CUP, pago directo al mensajero**, separado de los productos; nunca sumar mensajería a los productos ni permitir que una simulación `COTIZACION_SIMULADA` se convierta en tarifa real.
6. Revalidar antes de confirmar la operación; pedidos reales permanecen desactivados hasta autorización.

**No implementado:** cambios en `index.html`, conexión de checkout a datos empresariales o conversión de `COTIZACION_SIMULADA` en cotización comercial.

## 4. Criterios de aceptación para declarar cerrado
- Persistencia multiusuario con permisos comprobados, concurrencia/revisión y reversión segura.
- Alta/edición/activación de almacenes y proveedores y asociación a productos, validada en móvil y en almacenamiento compartido.
- Cobertura vial real comprobada para las zonas de La Habana admitidas, con actualización y trazabilidad.
- Cálculo para cesta con múltiples orígenes asociados, tarifa normal y especial, mínimo de 3 km y cobro separado.
- `PENDIENTE` ante falta de cobertura, cambios de cesta/destino/configuración o ausencia de rutas verificadas.
- Prueba final móvil de extremo a extremo con datos ficticios, sin activar pedidos reales.

## Autorizaciones independientes indispensables
**A — Persistencia staging:** autorizar explícitamente diseñar/aplicar tablas y RPC de entregas en staging, permisos y RLS, usando solo datos ficticios y sin modificar producción.

**B — Cartografía y motor vial:** autorizar la fuente de datos y las descargas/procesamiento necesarios tras presentar licencia, recursos y costos estimados; no asumir gratuidad.

**C — Integración en sitio de pruebas:** autorizar conectar el checkout a datos y rutas verificados y ejecutar pruebas controladas con pedidos reales desactivados; producción y pagos reales siguen excluidos.

No se requiere ninguna de esas autorizaciones para seguir diseñando o probando contratos offline, pero sí para demostrar cierre empresarial completo. No se ejecutaron GitHub Actions, Supabase, staging, producción, descargas, servicios ni despliegues.
