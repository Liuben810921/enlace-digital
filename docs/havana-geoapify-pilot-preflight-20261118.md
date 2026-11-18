# Piloto Geoapify: revisión documental y puertas de autorización (2026-11-18)

Base `8a8c10cbc7fd067b725064074f7b2376f8378955`; rama `plan/havana-osrm-benchmark-offline-20261114`. Alcance: solo documentación pública y preparación. Sin cuenta, API key, consultas autenticadas, costos, despliegues, modificación de código operativo, Supabase, staging, producción ni pedidos.

## Condiciones verificadas (fuentes oficiales)
- https://www.geoapify.com/pricing/ : Free 3.000 créditos/día; 5 requests/s; sin tarjeta; uso comercial y producción permitido según FAQ, con atribución Geoapify + OSM.
- https://apidocs.geoapify.com/docs/routing/ : ruta sencilla de dos puntos: 1 crédito base por par de waypoints; detalles, evitaciones, rutas largas u optimización pueden sumar créditos. **12 rutas simples = estimación 12 créditos**, no consumo observado.
- https://www.geoapify.com/terms-and-conditions/ : términos generales advierten restricciones del uso comercial gratuito en producción, posible suspensión o cargos por exceso. **Tensión documental** con FAQ de precios y https://www.geoapify.com/get-started-with-maps-api/ (Free no se convierte automáticamente en pago y no se cobra). Requerir confirmación escrita sobre Free, sobreconsumo, entidad que opera en Cuba y disponibilidad.
- https://www.geoapify.com/privacy-policy/ : Geoapify conserva body, headers, IP y timestamp por solicitud; generalmente <=24h en solicitudes exitosas.
- https://www.geoapify.com/data-processing-agreement/ : en situaciones excepcionales detalles pueden mantenerse hasta 2 meses; direcciones/coordenadas incluidas en datos potencialmente tratados. Solo puntos públicos ficticios en piloto.
- https://myprojects.geoapify.com/help/api-keys/ : restringir claves por IP, referrer u origin; CORS **no** restringe acceso; una clave en navegador es visible y no es secreta. No incluir claves en JS público, GitHub, capturas o logs.
- https://apidocs.geoapify.com/docs/routing/routing/ : modo `drive`, `format=json`, `waypoints=lat,lon|lat,lon` (¡no confundir con OSRM, que usa lon,lat!); salida `results[0].distance` en metros y `results[0].time` en segundos; validar errores, resultados vacíos, distancia no finita, desviaciones, y puntos ajustados a carretera.

## Protocolo propuesto (no ejecutado)
1. Obtener confirmación del proveedor sobre condiciones Free y posibilidad de uso desde/para Cuba; no afirmar que se dispone de elegibilidad.
2. Solicitar autorización **específica** para crear cuenta/proyecto y obtener clave; no hacerlo ahora. Configurar restricciones antes de cualquier llamada. Una clave para navegador solo sirve para un piloto aislado sin datos privados, no para confiar en cotizaciones reales; preferir intermediario seguro, sujeto a validación de coste cero.
3. Verificar 12 pares públicos del runbook `docs/havana-osrm-local-lab-runbook-20261118.md`, validando coordenadas de accesos viales con fuente pública independiente antes de solicitudes; usar `mode=drive&format=json`, dos waypoints, sin `details`, `avoid`, `optimize_stops`. Reintentos limitados, sin automatismo que exceda cuota.
4. Registro por caso: identificador, coordenadas públicas (lat,lon), timestamp, parámetros, respuesta/status, distancia m, tiempo s, créditos estimados/observados, sentido, ajuste de vía, referencia independiente y anomalías. No registrar claves.
5. Rechazar cotizaciones si `NoRoute`, sin cobertura, error HTTP, ausencia de datos, distancia no finita, rutas implausibles o cuota agotada; conservar estado `PENDIENTE` y revisión humana. No tocar sistema de pedidos.
6. Comparar pares ida/vuelta, cruces de bahía y periferia, y un caso `NoRoute` si existe pareja pública justificable; 12 pruebas no garantizan precisión general. Separar resultados de API y datos OSM históricos (PBF no usado por Geoapify).
7. Solo después de validación técnica, legal, de privacidad y arquitectura, proponer autorización independiente para integración aislada. Sin despliegues ni servicios hasta entonces.

## Hallazgos y bloqueantes
**GO para documentación, NO-GO para pruebas autenticadas**: faltan cuenta/clave (prohibidas por esta autorización), confirmación de condiciones comerciales aplicables a Cuba, verificación real de cobertura vial y arquitectura segura de clave sin coste. Ninguna llamada a Routing API realizada; 0/12 rutas medidas. El servicio API gratis no garantiza intermediario seguro gratis. No usar claves públicas en GitHub Pages.
