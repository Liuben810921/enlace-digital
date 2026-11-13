# Fase siguiente: ubicaciones y distancias (diseño aislado)

## Estado y límites
- Los almacenes y proveedores del prototipo se guardan en localStorage; todavía no hay persistencia compartida ni cambios en Supabase.
- La ubicación se representa mediante dirección textual, municipio de La Habana y latitud/longitud opcionales verificadas manualmente.
- Las coordenadas no son geocodificadas automáticamente y no constituyen una ruta ni distancia vial.
- Ningún cálculo de esta fase se incorpora al checkout real.

## Modelo de datos propuesto
- Proveedor: identificador estable y nombre/alias privado.
- Punto de salida: identificador, tipo propio/proveedor, proveedorId opcional u obligatorio si es proveedor, nombre, dirección, municipio, latitud/longitud opcionales, activo.
- Asociación producto-puntos de salida: múltiples identificadores de origen, sujetos al tipo y proveedor seleccionado.
- Preparación de pedido: origen **efectivamente seleccionado** para cada línea; disponibilidad en varios almacenes no significa que se usen todos.
- Destino: municipio/barrio y coordenadas de referencia, sin requerir dirección residencial exacta para cotizar.

## Cálculo y validaciones
1. Validar que cada línea tiene un origen activo compatible y que las coordenadas necesarias son válidas.
2. Seleccionar los puntos que realmente suministran las líneas; no usar indiscriminadamente todos los almacenes registrados.
3. Obtener **distancias por vía** mediante un proveedor de rutas aún no seleccionado. No confundir distancia geodésica con distancia vial.
4. Aplicar la distancia mayor de los orígenes usados, mínimo facturable 3 km y tarifa configurable de ejemplo 200 CUP/km; mínimo 600 CUP. Considerar tarifas especiales por producto y envío gratuito con reglas explícitas.
5. Mostrar cotización estimada en CUP, punto de salida, fecha de parámetros y fuente de distancia; no incluirla en total USD del producto.
6. Si no existe ruta o ubicación validada, indicar «tarifa pendiente de confirmar», sin inventar distancia ni precio.

## Pruebas necesarias antes de integrar
- Proveedor con uno y con varios almacenes, almacenes propios múltiples y cambio de proveedor.
- Almacén inactivo, producto sin origen, cambio de dirección, destino fuera de La Habana.
- Pedido con varias líneas y distintos puntos, tarifa especial, envío gratuito, distancia inferior a 3 km.
- Errores de servicio de mapas, coordenadas incompletas y distancia vial no disponible.
- Aislamiento de datos por navegador, no sincronización con Supabase ni checkout real.

## Pendiente de decisión
Elegir proveedor de rutas y confirmar cobertura, licencias, cuota gratuita y fiabilidad para calles de La Habana antes de usar distancias reales. Ningún servicio externo ha sido activado.
