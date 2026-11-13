# Administración futura de promociones de mensajería gratuita

**Fecha:** 13 de noviembre de 2026. **Ámbito:** diseño y pruebas sintéticas exclusivamente en rama aislada. **No activado.**

## Regla comercial aprobada para el prototipo
- Una promoción de entrega gratis de **cualquier producto** cubre **todo el pedido**, aunque haya varios almacenes y proveedores. El cliente no ve la procedencia logística.
- La promoción de pedido completo también cubre todo el pedido.
- Un subtotal en USD que alcanza el mínimo promocional configurado cubre todo el pedido. El umbral es inclusivo.
- Precedencia de motivo en el resultado sintético: promoción de pedido, producto, subtotal. El importe final es 0 CUP en cualquiera de los tres casos.
- Si ninguna promoción aplica, una única tarifa por pedido basada en el origen efectivo más lejano, con el mayor suelo de tarifa especial. No sumar cargos por producto ni almacén.
- Sin origen válido, sin distancia vial, fuera de La Habana o con configuración inválida, no emitir cotización, incluso si existe una promoción gratuita. Esto es una regla de seguridad del prototipo, no una decisión sobre atención manual.

## Panel administrativo propuesto (sin implementar)
Sección **Administración de entregas → Promociones de mensajería**:
1. Interruptor «Entrega gratis por importe de compra» (desactivado por defecto).
2. Campo «Importe mínimo del pedido (USD)», mayor que cero y con máximo dos decimales; solo se guarda cuando la promoción está activa.
3. Indicador por producto «Mensajería gratis», administrable exclusivamente por roles autorizados.
4. Promoción excepcional por pedido con autorización y registro de motivo; no permitir que clientes activen manualmente una promoción.
5. Vista previa de escenarios: subtotal justo inferior, igual y superior al umbral; carrito mixto con proveedor y almacén propio; producto voluminoso.
6. Auditoría de cambios: responsable, fecha, valor anterior/nuevo, vigencia y capacidad de reversión. Al integrar se requerirán controles de permisos y validación de servidor, no confiar en localStorage ni campos del cliente.

## Reglas de cálculo pendientes antes de producción
- Definir subtotal elegible en USD (descuentos, devoluciones, productos cancelados y redondeo); usar cantidades monetarias enteras en centavos para evitar errores de punto flotante.
- Precisar si las promociones tienen vigencia, categorías excluidas o limitaciones territoriales. La regla actual no contempla excepciones y se limita a La Habana.
- Para viajes separados físicamente, la promoción cubre al cliente; el costo logístico interno debe analizarse sin presentar cargos ocultos.
- El motor de rutas todavía es sintético. Se requiere validación vial real y un procedimiento de tarifa pendiente ante errores.

## Pruebas automáticas nuevas
`tests/delivery-promotion-config-isolated.cjs` valida el contrato administrativo en memoria, sin persistencia ni interfaz. `tests/delivery-promotion-config-isolated.test.cjs` prueba: productos gratuitos en pedidos con almacén y proveedor; especiales combinados; umbral exacto e inferior; umbral desactivado; prioridades de promociones; origen inválido; distancias ausentes; cobertura y configuraciones malformadas. GitHub Actions: workflow `isolated-delivery-quote.yml`.

**Límites:** no se modificó la interfaz administrativa real, Supabase, checkout, producción ni pedidos. Las pruebas no demuestran precisión de rutas reales ni cumplimiento integral de accesibilidad.
