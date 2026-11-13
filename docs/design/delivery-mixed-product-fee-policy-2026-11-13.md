# Política propuesta de tarifas especiales por producto — laboratorio aislado

**Fecha:** 13 noviembre 2026. **Estado:** recomendación comercial pendiente de aprobación; no activada.

## Alternativas consideradas
1. **Sumar todas las tarifas por producto y por almacén:** sencillo de calcular, pero puede duplicar el cobro de un mismo viaje y perjudicar pedidos mixtos. No recomendado como regla general.
2. **Cobrar solo la tarifa especial más alta:** evita acumulación, pero puede infracobrar trayectos largos si la tarifa especial es inferior al costo de la distancia. Requiere revisar alcance de cada tarifa.
3. **Una tarifa por pedido igual al máximo entre tarifa vial normal y la tarifa especial más alta de los productos cobrables:** propuesta de referencia. Evita sumar cargos repetidos y protege el mínimo de una entrega especial; exige validar comercialmente si una mercancía excepcional necesita logística separada.
4. **Entregas separadas por necesidad logística:** se tratarían como servicios diferentes únicamente si se comunica y aprueba explícitamente con el cliente. Fuera del prototipo actual.

## Política recomendada para evaluar (NO ACTIVADA)
- Una entrega consolidada genera **un único cargo** en CUP; la distancia base usa el almacén más lejano entre los efectivamente seleccionados, no el más lejano registrado.
- La tarifa normal aplica mínimo de 3 km y mínimo de 600 CUP con parámetros sintéticos actuales.
- Productos voluminosos con `specialFeeCup` generan un **suelo mínimo** para la entrega consolidada. Se usa el mayor de la tarifa normal y el mayor suelo especial, **no la suma** de los suplementos.
- `freeShipping` por producto lo excluye de los suelos especiales, pero no hace gratuito todo un pedido mixto. Si **todos** los productos tienen envío gratis, el cargo del pedido es cero. Una promoción explícita `orderFreeShipping=true` también deja el pedido en cero.
- Incluso en entregas gratuitas se exige validar origen efectivo y distancias para impedir cotizaciones incompletas.
- La tarifa especial de productos voluminosos que necesiten transporte distinto o viajes separados queda pendiente de evaluación humana; esta política **no** decide automáticamente consolidación física ni distribución de costos entre proveedores.

## Casos sintéticos cubiertos
- Almacenes efectivos a 2 y 8 km, almacén no utilizado a 100 km: base 1.600 CUP.
- Un producto a 2 km: mínimo 600 CUP.
- Voluminoso con suelo 2.400 CUP: se aplica 2.400 CUP si supera tarifa normal.
- Suelo 900 CUP y distancia normal de 8 km: se aplica 1.600 CUP.
- Dos productos especiales con suelos 2.400 y 3.000 CUP: un solo cargo de 3.000 CUP, no 5.400.
- Producto gratuito + otro de pago: el pedido conserva el cargo de entrega; dos gratuitos o promoción de pedido: 0 CUP.
- Rechazo de tarifas negativas, texto en lugar de números, duplicación de identificadores, origen sin distancia, cobertura fuera de La Habana y valores de promociones inválidos.

## Evidencia y límites
Código aislado: `tests/delivery-mixed-fees-isolated.cjs`. Pruebas: `tests/delivery-mixed-fees-isolated.test.cjs`. CI: `.github/workflows/isolated-delivery-quote.yml`.

**No se ha cambiado el motor de pedidos, la interfaz de checkout, Supabase, producción ni proveedores de rutas.** El prototipo no valida costos reales ni capacidad de consolidar bultos; la política requiere aprobación comercial y prueba de operaciones antes de integrarse.
