# Política revisada: entrega gratuita para todo el pedido

**Fecha:** 13 noviembre 2026. **Estado:** prototipo sintético aislado; no activado en tienda.

## Decisión comercial
La logística de almacenes y proveedores es interna a ENLACE DIGITAL. El cliente no debe recibir explicaciones ni cobros fragmentados por origen. **Una promoción de envío gratuito en cualquiera de los productos vuelve gratuita la entrega de todo el pedido**, incluso si intervienen almacenes diferentes. Lo mismo ocurre con una promoción general del pedido o al alcanzar un umbral configurable de subtotal en USD.

## Orden de aplicación
1. Validar cobertura, productos, origen efectivo por producto y distancias viales; si faltan datos, no inventar cotización.
2. Si `orderFreeShipping=true`, entrega total gratis.
3. Si cualquier producto tiene `freeShipping=true`, entrega total gratis.
4. Si el umbral `freeShippingThresholdUsd` está configurado y `orderSubtotalUsd >= freeShippingThresholdUsd`, entrega total gratis.
5. En ausencia de gratuidad, un solo cargo por pedido: máximo entre tarifa vial normal del origen efectivo más lejano y mayor suelo de tarifa especial por producto.

El umbral es opcional (nulo = desactivado), expresado en USD, estrictamente positivo y requiere subtotal explícito, validado y no negativo. **No se añade aún ningún control de administración ni integración con precios reales**: esto necesita diseño de permisos y autorización posterior.

## Pruebas automatizadas
Se actualizaron pruebas para un producto gratuito junto a otro pagado, múltiples almacenes, subtotal exactamente igual al umbral y justo por debajo, umbrales inválidos, subtotal ausente y distancias faltantes incluso en pedidos gratis. La primera ejecución de CI después del cambio de código utilizó expectativas anteriores y falló; las expectativas fueron actualizadas en el siguiente commit. Verificar el último workflow antes de dar la batería por aprobada.

## Riesgos pendientes
- No se ha acordado si una promoción cubre transportes físicamente separados por volumen; la regla comercial propuesta sí cubre el pedido completo, y la empresa asume el costo logístico salvo condiciones promocionales explícitas futuras.
- No se ha definido el subtotal elegible (descuentos, impuestos, productos cancelados, moneda ni tipo de cambio); por ahora el subtotal es un dato sintético externo.
- No se ha integrado a checkout, Supabase, pedidos, proveedores de rutas ni producción.
