# Geoapify como proveedor principal — integración offline, 2026-11-20

Base `94ddd9b569ba19f02a82607fd6f4e5e4f87a6cfc`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Decisión del usuario: **Geoapify** como servicio principal; OSRM autoalojado queda como alternativa futura, no bloquea el lanzamiento. Referencia operativa acordada: plan gratuito de 3000 créditos/día, normalmente 1 crédito por ruta simple. El consumo real puede ser mayor por varios orígenes, reintentos o servicios distintos; verificar condiciones vigentes antes de uso real.

## Cambio funcional

Se creó `experiments/havana-delivery-quote/geoapify-offline.js` con `adaptGeoapifyRoutes`. Es un adaptador puro para respuestas simuladas con esquema GeoJSON FeatureCollection de Geoapify. No ejecuta `fetch`, no admite ni guarda claves, no altera checkout. Rechaza revisión inválida, orígenes duplicados o faltantes, respuestas extrañas, códigos HTTP distintos de 200 y métricas fuera de límites. Convierte metros a kilómetros y conserva `status:'unverified'`; **no crea rutas verificadas**. Devuelve `PENDIENTE/ROAD_PROVIDER_NOT_TRUSTED` incluso con datos bien formados. Es deliberado: el JSON simulado no prueba autenticidad.

## Casos focalizados definidos para ejecución en un runtime JS aislado

1. Un origen y distancia 4500 m -> ruta no verificada 4.5 km; resultado PENDIENTE.
2. Dos orígenes con respuestas completas -> dos rutas, ambas no verificadas.
3. Dos orígenes y una respuesta -> INCOMPLETE_ROUTES.
4. Dos respuestas para el mismo origen -> ROUTE_SCOPE_MISMATCH.
5. HTTP 429 -> GEOAPIFY_RESPONSE_INVALID.
6. `features:[]` -> GEOAPIFY_RESPONSE_INVALID.
7. Distancia negativa, infinita o mayor de 300000 m -> GEOAPIFY_METRICS_INVALID.
8. `contextRevision` inválido -> INVALID_REVISION.
9. Ninguna respuesta, o origen no declarado -> PENDIENTE.
10. Aun con fixture válido, jamás devolver COTIZACION_SIMULADA ni tarifa real.

**Estado de las pruebas:** casos documentados, **no se afirma que se hayan ejecutado en un navegador ni en CI**. La integración con `edDeliveryCheckoutPreview` se mantiene sin conectar para impedir que respuestas no autenticadas se transformen en tarifas. Se requiere un futuro componente de confianza del servidor y política de cuotas/caché, no clave expuesta en HTML público.

## Bloqueantes

- Confirmar credenciales y consumo del plan Geoapify, con autorización separada y sin exponer clave en frontend.
- Definir un intermediario seguro, control de cuota y reintentos, procedencia autenticada y expiración de rutas.
- Geocodificar direcciones con precisión suficiente y validar trayectos de La Habana.
- Diseñar cotización con múltiples orígenes: cada ruta puede consumir crédito; 3000 créditos no equivalen automáticamente a 3000 entregas.
- Validar tarifa especial, regla del almacén más lejano, límites de La Habana y errores de red.
- Persistencia compartida y atomicidad entre pestañas continúan PENDIENTES.

Sin llamadas Geoapify, claves, descargas, instalaciones, GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos.
