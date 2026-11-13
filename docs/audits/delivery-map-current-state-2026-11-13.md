# Auditoría del sistema de entregas y mapa — 2026-11-13

**Alcance:** inspección estática de `main/index.html` y `tests/customer-order-flow.cjs`. Rama aislada creada desde `main`; sin modificaciones de la tienda, Supabase, producción ni pedidos.

## Estado comprobado
- Existe la pestaña de administración `delivery`, rotulada **Mensajería**; abre **Tarifas de mensajería en CUP**.
- Las tarifas actuales se editan por municipio y barrio: `state.fees[municipio+'|'+barrio]`. El botón Guardar indica explícitamente que solo guarda en el navegador de demostración; añadir zona también es temporal.
- No se observó en este flujo de administración un cálculo por coordenadas, un mapa operativo, almacenes de salida, distancia mínima de 3 km, tarifa por km, ni selección del almacén más lejano.
- La vista previa oficial `edOfficialOrderPreview` valida sesión, destinatario, stock y precios; declara explícitamente que la mensajería está pendiente de habilitación y **no registra pedidos reales**.
- El test `tests/customer-order-flow.cjs` cubre vista previa, destinatarios, carrito alterado, precios inválidos y restauración de sesión, pero **no prueba distancias ni tarifas**.

## Requisitos aprobados pendientes de implementación
- Cobertura inicial: La Habana.
- Múltiples almacenes; para cobro al cliente se toma el más lejano aplicable.
- Distancia mínima facturable: 3 km; parámetro de ejemplo: 200 CUP/km; mínimo 600 CUP.
- Entrega especial por producto voluminoso; campos tarifa normal/especial.
- Distancia por mapa de referencia; no exigir ubicación exacta de la vivienda.
- Guardar y reutilizar direcciones ocasionales; recalcular tarifa vigente al repetir compra.
- Denominación administrativa: **Administración de entregas**.

## Próxima implementación segura sugerida
1. Crear módulo puro de cotización de entregas con entradas de distancia confiables y parámetros editables, sin red, sin geolocalización del cliente y sin activar pedidos.
2. Añadir pruebas unitarias para 0–3 km, redondeo, almacén más lejano, envío gratis, tarifa especial y direcciones fuera de cobertura.
3. Integrar en un prototipo visual aislado y probar en móvil antes de tocar el checkout de producción.
4. Para mapa real, elegir proveedor/cartografía y definir puntos de referencia y almacenes autorizados. Nunca inventar distancias.
