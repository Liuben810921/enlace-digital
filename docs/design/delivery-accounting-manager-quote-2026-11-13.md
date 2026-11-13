# Entregas: umbral privado, contabilidad y futuro cotizador de gestores

**Estado:** contrato sintético en rama aislada; no activado ni conectado a pedidos reales. Fecha: 13 noviembre 2026.

## Reglas del negocio
1. Umbral de gratuidad **inicial ilustrativo 200 USD**, editable **solo por administrador general**. El contrato `validateAdminDeliverySettings` rechaza roles distintos; una implementación futura necesita validación autoritativa de permisos en servidor y auditoría. No se ha cambiado la configuración real.
2. El sistema calcula siempre la tarifa vial base y el mayor suelo especial usando únicamente los almacenes efectivos. Aplica redondeo **hacia arriba al múltiplo configurable de 100 CUP** como propuesta inicial (p. ej. 3 km = 600 CUP; 3,4 km = 680 CUP sin redondeo y 700 CUP redondeados).
3. La cotización debe conservar tres campos diferenciados: `calculatedDeliveryValueCup` (valor comercial estimado de mensajería), `customerFeeCup` (lo cobrado al cliente), `promotionCoveredCup` (valor de entrega bonificado). Estos importes no representan automáticamente costo real pagado al mensajero, que deberá registrarse por separado.
4. Un producto gratis o el subtotal que alcanza el umbral deja `customerFeeCup=0` para el pedido completo, independientemente del número de almacenes. **El valor calculado no se borra.**
5. El futuro gestor podrá consultar una cotización previa sin crear pedido mediante `previewForManager`; requiere destino de referencia y distancias viales verificadas, no expone proveedores ni almacenes al cliente. No existe todavía pantalla ni acceso operativo de gestores.

## Límites y seguridad
- La verificación de rol en el prototipo es una comprobación local y **no es autorización real**. La integración debe aplicar controles de servidor, transacciones, auditoría, y evitar que el navegador altere los valores.
- La ruta y las distancias son datos sintéticos, sin proveedor externo de rutas. El cálculo de tarifa no equivale al costo efectivo del servicio.
- El subtotal elegible debe definirse en centavos USD para producción, tras descuentos, devoluciones y cantidades. El prototipo usa números con decimales.
- El redondeo por múltiplos de 100 CUP es una propuesta sujeta a confirmación comercial.

## Pruebas
`tests/delivery-accounting-manager-isolated.cjs` y `tests/delivery-accounting-manager-isolated.test.cjs`; CI `isolated-delivery-quote.yml`. Comprueban tarifa gratuita y valor contable conservado, umbral, redondeo, especial, fallos de distancias, permisos sintéticos y vista previa sin pedido.
