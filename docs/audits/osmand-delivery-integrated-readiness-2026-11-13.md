# Revisión integral del laboratorio OsmAnd y entregas aisladas

**Fecha:** 13 de noviembre de 2026 · **Rama:** `audit/delivery-map-readonly-20261113`

## Estado confirmado por auditoría de código
- El laboratorio administrativo permite registrar rutas ficticias, importar/exportar matrices JSON, cargar 12 escenarios sintéticos y calcular estadísticas de error y disponibilidad. Los datos están en `localStorage` del navegador, no en Supabase.
- Existe un lector de coordenadas OsmAnd y un esquema SVG local; **no existe un mapa vial real ni una ruta calculada automáticamente**.
- Los módulos Node aislados prueban cotización por origen efectivo, lectura de respuestas OSRM sintéticas, caché y bloqueo de tarifa cuando no hay validación. **No están integrados al checkout operativo**.
- La lógica de despacho exige seleccionar origen efectivo cuando hay varios, y no debe sustituirse por el almacén más lejano disponible.
- La matriz de 12 escenarios **no representa mediciones reales de La Habana**. La precisión real y la disponibilidad de un proveedor de rutas siguen sin verificarse.

## Riesgos de integración, prioridad
| Prioridad | Riesgo | Condición para resolverlo |
|---|---|---|
| Bloqueante | Un cálculo sintético pudiera confundirse con tarifa real | Mantener separación de entornos, indicador sintético y fallo seguro; prohibir integración a pedidos sin autorización |
| Bloqueante | Cobertura o sentidos de vías incorrectos en La Habana | Medir rutas reales con OsmAnd y comparar el mismo origen, destino, sentido y perfil |
| Bloqueante | Selección errónea del origen de un producto | Vincular productos, proveedores y almacenes efectivos en una transacción validada; probar multi-origen |
| Bloqueante | Exposición de claves o ubicaciones privadas | API exclusivamente en backend autorizado, secretos no públicos, cuotas, autenticación y minimización de datos |
| Alta | Tarifa incorrecta ante timeout, sin ruta o datos corruptos | Mostrar «Tarifa pendiente de confirmar» sin inventar distancia ni cobrar automáticamente |
| Alta | Caché obsoleta o distinta dirección de ruta | Clave por origen/destino ordenados, perfil, versión de mapa y política de expiración |
| Alta | Tarifa especial, entrega gratuita y mínimo de 3 km | Contratos y pruebas para combinación de reglas antes de conectar al checkout |
| Media | Accesibilidad y distribución móvil | Verificación visual en Android, teclado, lector de pantalla, zoom y contraste |
| Media | Persistencia de laboratorio en navegador | Evitar datos personales, documentar borrado, no usar para registros operativos |

## Lista de aceptación: prueba visual móvil (pendiente, no ejecutada)
- [ ] Abrir la rama en un entorno de previsualización aislado autorizado, no producción.
- [ ] Revisar a 320, 360, 393 y 430 px de ancho; no debe existir recorte horizontal del formulario ni botones inaccesibles.
- [ ] Comprobar orientación vertical y horizontal y zoom de texto al 200 % sin pérdida de funciones.
- [ ] Tocar etiquetas y verificar foco en ID, ruta, kilómetros, disponibilidad y JSON; comprobar teclado decimal móvil.
- [ ] Recorrer con teclado y lector de pantalla: orden lógico, anuncios de errores, tabla desplazable, títulos de columnas.
- [ ] Probar con una matriz ficticia de 100 filas: tabla y textarea utilizables, tiempos de respuesta aceptables.
- [ ] Verificar estados: JSON inválido, matriz demasiado grande, almacenamiento lleno, confirmación de reemplazo y vaciado.
- [ ] Confirmar que no hay acceso a pedidos reales ni solicitudes de red a rutas desde el laboratorio.
- [ ] Registrar capturas, dispositivo, navegador, versión, fecha y resultado de cada caso.

## Lista de aceptación: rutas reales en La Habana (pendiente, requiere autorización separada)
- [ ] Definir almacenes de prueba y destinos de referencia públicos, sin domicilios de clientes.
- [ ] Cubrir al menos los 12 tipos de trayecto de `docs/design/havana-osmand-route-validation-matrix-2026-11-13.md` y varios sentidos inversos.
- [ ] Para cada caso, registrar GPS WGS84, perfil automóvil, sentido, fecha, versión de mapas y distancia vial de OsmAnd.
- [ ] Comparar con motor candidato usando puntos y perfil equivalentes; anotar ruta ausente, restricciones, calles unidireccionales y diferencias.
- [ ] Calcular disponibilidad, error absoluto medio, error relativo y porcentaje de casos dentro de tolerancia.
- [ ] Revisar manualmente diferencias mayores que 0,5 km **y** 10 % (criterio provisional, no aprobación comercial).
- [ ] Validar distancias mínimas, varios almacenes efectivos, proveedores, mercancía grande, tarifa especial y envío gratis.
- [ ] Documentar política de reintentos, caché, fallback manual, límites de costo y respuesta a indisponibilidad.
- [ ] Obtener autorización ejecutiva antes de conectar servicio de rutas, Supabase, checkout o pedidos reales.

## Comprobaciones automatizadas
`tests/delivery-integration-contracts.test.cjs` revisa fronteras offline, selección explícita, cotización pendiente y ausencia de llamadas de red en los módulos aislados. El workflow `isolated-delivery-quote.yml` ejecuta también las baterías previas de UI, origen, caché y validación.

## Alcance de la evidencia
Auditoría estática y pruebas Node/VM; **no** constituye auditoría de seguridad completa, prueba visual real en móvil, verificación de datos viales de La Habana ni integración de producción.
