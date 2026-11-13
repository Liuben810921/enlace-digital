# Prototipo administrativo aislado de promociones de mensajería

**Fecha:** 13 noviembre 2026. **Estado:** prototipo de lógica en memoria, sin interfaz visual ni integración con pedidos.

## Funcionalidad
- Borrador de promoción por subtotal en USD, activable/desactivable, y lista de identificadores de productos con entrega gratis.
- Validación estricta del umbral en USD y de los identificadores de productos; no se aceptan duplicados.
- Vista previa de un pedido ficticio con almacenes efectivos, tarifas especiales y gratuidad para todo el pedido cuando cualquier producto está promocionado o se alcanza el umbral.
- Reversión del borrador al estado inicial; las copias entregadas al consumidor no pueden modificar el borrador por referencia.
- Cambios inválidos no sustituyen un borrador válido. Se rechaza la promoción de productos inexistentes en la vista previa.
- Distancias viales ausentes y cobertura fuera de La Habana impiden cotizar, incluso si la promoción es gratuita.

## Comprobación
`tests/delivery-promotion-admin-preview-isolated.cjs` y `tests/delivery-promotion-admin-preview-isolated.test.cjs` se incorporaron a `.github/workflows/isolated-delivery-quote.yml`. Verificar la ejecución CI más reciente.

## Próxima integración (requiere aprobación específica)
Crear una interfaz móvil en **Administración de entregas** con interruptor de promoción, umbral USD, selector de productos, vista previa y botón de deshacer. No confiar en estado del navegador como autoridad comercial; las promociones deben validarse en servidor con permisos administrativos, historial de cambios y fecha de vigencia. Definir subtotal elegible después de descuentos y cancelaciones. Ninguna función de este prototipo escribe a Supabase, pedidos, producción ni servicios externos.
