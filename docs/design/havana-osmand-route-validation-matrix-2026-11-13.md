# Matriz de validación de rutas de La Habana contra OsmAnd

**Estado:** plantilla de pruebas. Ninguna ruta real fue consultada ni medida. Todos los valores de los tests automatizados son sintéticos.

## Procedimiento reproducible
1. Registrar en OsmAnd la coordenada WGS84 de cada almacén propio o proveedor y la del destino de referencia; usar perfil de automóvil y anotar sentido origen → destino.
2. Anotar distancia vial en km, fecha, versión de mapa y, cuando se conozca, restricciones o desvíos relevantes. No registrar domicilios privados de clientes en este documento.
3. Consultar posteriormente, solo con autorización independiente, el motor candidato con los mismos puntos y perfil equivalente.
4. Comparar distancia y disponibilidad, registrar anomalías de sentido, calles unidireccionales, puentes, cruces y zonas sin acceso.
5. Provisionalmente marcar revisión si la diferencia absoluta supera 0,5 km **y** la relativa supera 10 %. Son criterios de QA propuestos, no límites aprobados para facturar ni una garantía de precisión.
6. No habilitar tarifas automáticas hasta completar una muestra representativa y aprobar criterios de aceptación de negocio.

## Matriz de captura (sin resultados reales)
| Caso | Tipo de origen | Destino de referencia | Cobertura | OsmAnd km | Motor km | Estado |
|---|---|---|---|---|---|---|
| H01 | Almacén propio | Habana Vieja | Centro urbano, trayecto corto | Pendiente | Pendiente | No probado |
| H02 | Proveedor A | Centro Habana | Centro urbano, sentidos únicos | Pendiente | Pendiente | No probado |
| H03 | Proveedor B | Playa | Tramo intermunicipal | Pendiente | Pendiente | No probado |
| H04 | Almacén propio | Marianao | Tramo intermunicipal | Pendiente | Pendiente | No probado |
| H05 | Proveedor A | Guanabacoa | Accesos y cruces | Pendiente | Pendiente | No probado |
| H06 | Almacén propio | Habana del Este | Tramo largo | Pendiente | Pendiente | No probado |
| H07 | Proveedor B | Boyeros | Periferia | Pendiente | Pendiente | No probado |
| H08 | Almacén propio | Arroyo Naranjo | Periferia | Pendiente | Pendiente | No probado |
| H09 | Proveedor A | Cotorro | Periferia y tramo largo | Pendiente | Pendiente | No probado |
| H10 | Almacén propio | La Lisa | Tramo intermunicipal | Pendiente | Pendiente | No probado |
| H11 | Almacén propio | Mismo municipio | Menos de 3 km; mínimo de tarifa | Pendiente | Pendiente | No probado |
| H12 | Dos almacenes efectivos | Destino común | Se factura el origen utilizado más lejano | Pendiente | Pendiente | No probado |

## Reglas de fallo seguro
- Si el motor responde sin ruta, agota el tiempo, presenta una distancia inválida o difiere de OsmAnd fuera de tolerancia, mostrar **«Tarifa pendiente de confirmar»**.
- No convertir distancia en línea recta en distancia vial ni usar coordenadas ficticias como si fueran ubicaciones verificadas.
- Mantener origen y destino de referencia, perfil, dirección del trayecto, fecha y versión de datos para trazabilidad, evitando exponer domicilios privados.
- Las matrices de distancia de OSRM pueden devolver celdas sin ruta; evitar usar el parámetro de velocidad de respaldo para facturación porque genera estimaciones, no rutas viales verificadas.

## Implementación aislada
- `tests/delivery-route-validation-isolated.cjs` evalúa tolerancias, disponibilidad y bloqueo de tarifas.
- `tests/delivery-route-validation-isolated.test.cjs` prueba rutas sintéticas y resultados pendientes.
- Sin solicitudes externas, sin datos reales y sin conexión con el checkout.

Referencia técnica: https://project-osrm.org/docs/v26.5.0/http
