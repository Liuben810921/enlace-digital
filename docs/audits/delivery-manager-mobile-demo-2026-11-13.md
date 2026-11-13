# Auditoría de la demostración móvil del cotizador de gestores

**Fecha:** 13 de noviembre de 2026. **Rama aislada:** `audit/delivery-map-readonly-20261113`.

## Entregado
- Archivo HTML autónomo `tests/fixtures/delivery-manager-mobile-demo.html` con diseño adaptable a móvil.
- Selección de cliente nuevo o habitual; precarga de dirección guardada ficticia para habituales; elección de dirección alternativa; último importe histórico de 600 CUP como **referencia únicamente**.
- Botón «Recalcular tarifa vigente»; resultados diferenciados de valor calculado, importe del cliente y bonificación.
- Datos sintéticos: tarifa 200 CUP/km, mínimo de 3 km y 600 CUP, redondeo al alza de 100 CUP, entrega gratis desde 200 USD o por producto. El gestor no puede cambiar parámetros en esta demo.
- Restablecimiento de valores de demostración y validación de campos antes de cotizar. No guarda direcciones ni crea pedidos.

## Pruebas
`tests/delivery-manager-mobile-demo.test.cjs` comprueba DOM, etiquetas, diseño adaptable, estado accesible, ausencia de llamadas de red, cambio de cliente nuevo/habitual, dirección guardada/alternativa, recálculo, importe histórico separado, bonificación, tarifa especial, rechazo de dirección vacía y restablecimiento.

## Límites y riesgos antes de integrar
- **No hay conexión con clientes reales ni permisos de sesión**. La demo usa direcciones y distancias ficticias. Los datos históricos de clientes solo deberán consultarse con autorización de servidor.
- La página HTML replica cálculos básicos; **no es el motor único de precios** y no está conectada a la validación de rutas por destino. Para producción, usar el motor central de cotización y distancias verificadas para la dirección seleccionada; no aceptar kilómetros arbitrarios del gestor.
- La demo no usa el mapa ni obtiene direcciones de terceros; solo muestra el flujo visual.
- Las pruebas son automatizadas con DOM simulado; no sustituyen inspección visual ni pruebas en Android real.
- La regla de gratuidad comercial no elimina el valor calculado de mensajería; el costo real pagado al transportista debe llevarse aparte.

## Seguridad
No se modificaron Supabase, producción, checkout, pedidos ni clientes reales. El archivo está dentro de `tests/fixtures` y no se publica como funcionalidad de la tienda.
