# Cotizador futuro de gestores: clientes nuevos y habituales

**Fecha:** 13 noviembre 2026. **Estado:** diseño y pruebas sintéticas, no integrado a administración ni a pedidos reales.

## Flujo recomendado
- **Cliente nuevo:** gestor selecciona un destino de referencia o introduce una dirección; el motor debe obtener distancia vial verificada para ese destino antes de mostrar una tarifa.
- **Cliente habitual:** precargar dirección guardada, mostrar **último importe conocido solo como referencia histórica** y ofrecer botón «Recalcular tarifa actual». Nunca reutilizar el precio histórico como tarifa vigente.
- **Dirección alternativa:** el gestor puede elegir otra referencia; se exige nueva distancia vial asociada a la dirección elegida. No reemplazar la dirección habitual por consultar una alternativa.
- **Tarifa vigente:** calcular con los orígenes efectivos del pedido o cesta simulada, tarifa CUP/km actual, distancia mínima, tarifa especial y redondeo hacia arriba a múltiplos de 100 CUP (múltiplo editable únicamente por administrador general en la futura aplicación).
- **Entrega gratis:** si existe promoción por producto o el subtotal alcanza el umbral (200 USD ilustrativo, editable solo por administrador general), el cliente paga 0 CUP, pero se conserva el valor comercial estimado de la entrega y la bonificación para contabilidad. El costo real del mensajero se registra aparte.

## Seguridad y precisión
- Los gestores pueden **consultar**, no cambiar los parámetros comerciales. La autorización de roles en las pruebas es sintética: requiere validación de servidor en la futura integración.
- La prueba exige que `verifiedDestinationLabel` coincida con la dirección seleccionada; si no coincide, la cotización falla cerrada. Esta coincidencia textual es solo una protección sintética. En producción se requiere identificador estable de dirección, versión, coordenadas de referencia, procedencia y vigencia de la ruta, sin aceptar datos de distancia arbitrarios del navegador.
- No se consulta ni modifica la ficha de ningún cliente real. Se usan direcciones y valores ficticios.
- No se crea pedido, no se modifica la dirección guardada y no se escriben datos persistentes.
- Si la ruta falla, no mostrar una tarifa antigua como precio definitivo; ofrecer cotización pendiente o confirmación manual.

## Implementación y pruebas
- `tests/delivery-manager-customer-preview-isolated.cjs`: adaptador de cotización sintética.
- `tests/delivery-manager-customer-preview-isolated.test.cjs`: cliente nuevo, habitual, dirección guardada, alternativa, cambio de distancia, último precio histórico, promoción gratuita, tarifa especial, rechazo de distancia ausente y desajuste de destino, permisos y cobertura.
- `.github/workflows/isolated-delivery-quote.yml`: incluye nueva prueba. Verificar resultado del último run antes de concluir.

## Próximo paso seguro
Diseñar interfaz móvil de **Cotizar mensajería** en el futuro panel de gestores con selector «cliente nuevo / habitual», destino guardado/alternativo, subtotal y productos; mostrar el último valor como referencia secundaria y la tarifa actual como resultado principal. No integrar con clientes reales hasta autorización independiente.
