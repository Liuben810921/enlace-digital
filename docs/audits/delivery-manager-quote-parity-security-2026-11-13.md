# Revisión de coherencia, destinos y permisos del cotizador móvil

**Fecha:** 13 noviembre 2026. **Estado:** rama aislada; pruebas sintéticas aprobadas en GitHub Actions: https://github.com/Liuben810921/enlace-digital/actions/runs/43499896007

## Cambios
- Se creó `tests/fixtures/delivery-quote-shared-core.js`, núcleo de cálculo puro reutilizable en Node y en la demostración HTML, sin red ni persistencia.
- La demo móvil carga este núcleo en vez de replicar la fórmula directamente.
- Se añadió un paso «Verificar ruta simulada», asociado al texto de dirección y distancia introducidos. Cambiar tipo de cliente, dirección o distancia invalida la verificación; no se cotiza hasta repetirla.
- `tests/delivery-shared-quote-parity.test.cjs` compara **448 escenarios** con el adaptador de contabilidad Node: distancia, tarifa especial, subtotal y producto con entrega gratuita. Comprueba valor comercial calculado, cobro y bonificación.
- Se actualizaron pruebas de la interfaz para exigir la reverificación de ruta al cambiar destino.

## Resultado
La ejecución inicial falló porque el test anterior intentaba cotizar después de cambiar la dirección sin verificar de nuevo. Se corrigió el test y el workflow terminó en **success**. Las reglas de redondeo al alza de 100 CUP, umbral de 200 USD y bonificación de todo el pedido siguen consistentes en los escenarios comprobados.

## Limitaciones de seguridad
- **La ruta sigue siendo simulada**: el botón confirma únicamente que los datos de demostración están asociados al destino actual; no verifica geografía ni distancias reales.
- **La demostración no autentica gestores ni administradores**: la separación de permisos es un contrato sintético. Antes de integración real se requiere comprobación de rol en servidor y auditoría de cambios administrativos.
- El núcleo compartido de demostración cubre un origen/distancia agregada. El cálculo operativo con varios almacenes debe utilizar el planificador completo de orígenes efectivos y distancias verificadas, sin confiar en entradas del navegador.
- No se ha probado visualmente en Android real. No se ha conectado con Supabase, producción, clientes reales, checkout ni pedidos.

## Archivos
`tests/fixtures/delivery-manager-mobile-demo.html`, `tests/fixtures/delivery-quote-shared-core.js`, `tests/delivery-manager-mobile-demo.test.cjs`, `tests/delivery-shared-quote-parity.test.cjs` y workflow `isolated-delivery-quote.yml`.
