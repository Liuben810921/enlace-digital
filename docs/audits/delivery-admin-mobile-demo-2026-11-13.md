# Demostración móvil aislada — configuración de mensajería

**Fecha:** 13 noviembre 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **Estado:** prototipo HTML autónomo, no integrado.

## Decisiones comerciales
- Umbral ilustrativo inicial: 200 USD. En producción su edición deberá estar restringida al administrador general con permisos verificados en servidor.
- Redondeo hacia arriba al múltiplo configurable de 100 CUP, por defecto. La edición del múltiplo también será exclusiva del administrador general.
- La entrega gratuita para todo el pedido no elimina el valor comercial calculado de mensajería. Se distinguen valor calculado, cobro al cliente y bonificación. El costo real del mensajero es otra magnitud y requiere registro separado.
- Los gestores tendrán más adelante un cotizador previo, sin crear pedido y sin revelar información interna de proveedores.

## Prototipo
Archivo `tests/fixtures/delivery-admin-mobile-demo.html`. Formulario móvil autónomo con campos de umbral, múltiplo, promoción por importe, subtotal, distancia ficticia, tarifa especial y gratuidad por producto. Vista previa de tres importes y botón para restablecer los valores iniciales. Sin localStorage, red, Supabase ni pedidos.

## Comprobaciones
`tests/delivery-admin-mobile-demo.test.cjs` verifica etiquetas, viewport, estado accesible, ausencia de llamadas de red y cálculo sintético: 3,4 km a 200 CUP/km = 680 CUP, redondeados a 700 CUP; pedido de 200 USD con umbral de 200 USD cobra 0 CUP y conserva 700 CUP de valor estimado; tarifa especial 1.250 CUP se redondea a 1.300 CUP. También prueba la reversión.

GitHub Actions: https://github.com/Liuben810921/enlace-digital/actions/runs/43499020760 — success.

## Límites
- El HTML es una **demostración independiente**, no una pantalla dentro de la tienda ni un sistema de permisos. La comprobación de roles anterior es sintética, no autenticación real.
- Las distancias se introducen manualmente para simular un cálculo; no se ha conectado ningún motor vial.
- El cálculo HTML replica parámetros ficticios, no comparte todavía el módulo Node de cotización; al integrar habrá que centralizar las reglas para evitar divergencias.
- Falta inspección visual y prueba de accesibilidad en dispositivo móvil real antes de cualquier integración.
