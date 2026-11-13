# Contrato aislado para cotizador de gestores — integración futura

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **Estado:** pruebas sintéticas aprobadas, no desplegado. Workflow: https://github.com/Liuben810921/enlace-digital/actions/runs/43500130301

## Contrato
`tests/delivery-manager-server-contract-isolated.cjs` exporta `quoteManagerServerContract({request,context})`. La solicitud del gestor solo acepta tipo de cliente, identificador de cliente, identificador de dirección guardada, dirección propuesta o alternativa y referencia de cesta. Rechaza campos adicionales, incluidos importes, kilómetros y roles suministrados por el navegador.

El contexto debe construirse exclusivamente en un servicio autenticado: principal con rol y asignaciones, clientes autorizados, direcciones guardadas, cesta y orígenes de despacho, rutas viales verificadas y versión de parámetros comerciales. El prototipo no implementa ni sustituye ese servicio.

Para un cliente habitual se comprueba asignación al gestor y acceso a la dirección guardada; para una alternativa no se sobrescribe la dirección habitual; para un cliente nuevo se usa dirección propuesta. El último importe de una dirección guardada se muestra solo como referencia histórica y jamás alimenta el cálculo vigente.

La ruta se exige asociada a la cesta, al destino seleccionado y a la versión vigente de configuración. En el prototipo se rechaza una ruta sin bandera de verificación, futura o con antigüedad mayor de 15 minutos. La caducidad de 15 minutos es una propuesta técnica revisable, no una política operativa aprobada.

## Contabilidad
Se calcula con el planificador de orígenes efectivos y el adaptador de contabilidad sintéticos. Entrega gratis por producto o por subtotal de al menos 200 USD: `customerFeeCup=0`, conservando `calculatedDeliveryValueCup` y `promotionCoveredCup`. Redondeo hacia arriba al múltiplo de 100 CUP. El costo efectivo del transportista es un registro distinto.

## Pruebas
`tests/delivery-manager-server-contract-isolated.test.cjs` verifica cliente nuevo y habitual, dirección alternativa, permisos de rol y asignación, titularidad de cesta, rechazo de campos no permitidos, dirección no autorizada, ruta ausente o caducada, cambio de versión, ausencia de distancia, bonificación y ausencia de creación de pedidos.

## Requisitos pendientes antes de integrar
1. Autenticación y autorización **autoritativas en servidor**; validar sesión, asignación y rol en cada petición. El contrato usa objetos de contexto ficticios que en producción deben obtenerse de fuentes confiables, no del navegador.
2. Servicio de rutas verificadas con identificadores estables de destino, versión, coordenadas de referencia, origen, procedencia y caducidad. Una bandera `verified:true` **no prueba por sí sola** que una ruta sea genuina.
3. Cálculo centralizado de la cesta y subtotal en centavos USD, tras descuentos; los productos y almacenes efectivos deben provenir del backend.
4. Auditoría de cambios del administrador general para umbral y redondeo, sin capacidad de edición por gestores.
5. Protección de datos personales, control de acceso por cliente y registros sin exposición de direcciones a otros gestores.
6. Pruebas de integración autorizadas con staging, revisión visual móvil y aprobación separada antes de cualquier activación.

**No se modificaron Supabase, producción, clientes reales, checkout ni pedidos.**
