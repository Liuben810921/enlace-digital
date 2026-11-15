# Investigación de alojamiento y API de rutas para ENLACE DIGITAL — 2026-11-15

Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base `5a4cb44b8db159e472609e4291473cad02b5f18a`.

## Decisión
**NO-GO para producción y para cálculo de tarifas reales por proveedor externo.** No hay VPS gratuito permanente con elegibilidad contractual comercial cubana demostrada. Una API de rutas puede sustituir funcionalmente a OSRM para distancia por carretera, pero requiere autorización de uso comercial en Cuba, cuota adecuada, privacidad y continuidad verificadas. No se han creado cuentas ni enviado solicitudes ni probado rutas.

## Hallazgos de fuentes primarias (revisión documental)
| Opción | Evidencia oficial | Bloqueante y dictamen |
|---|---|---|
| GraphHopper API | https://www.graphhopper.com/pricing/ y https://www.graphhopper.com/terms/ | Free 500 créditos/día; la página de precios dice **uso no comercial**; los términos admiten uso comercial en producción **previa consulta/autorización**. Sin aprobación escrita para empresa cubana. **NO-GO** |
| openrouteservice (HeiGIT) | https://openrouteservice.org/plans/ y https://openrouteservice.org/terms-of-service | Página de planes redirige a cuenta HeiGIT, cuyo texto legal no fue recuperable en la consulta; una copia pública de planes describe Standard gratis y Collaborative sin uso comercial. **No se confirmó licencia comercial Standard ni Cuba. PENDIENTE** |
| Valhalla demo FOSSGIS | https://valhalla.github.io/valhalla/ | Servidor de demostración sujeto a fair use y rate limits; no es contrato de servicio comercial ni SLA. **NO-GO** |
| Fondation Simafri VPS | https://www.simafri.com/uk/free-vps-for-open-source-projects/ | 2 vCPU, 4 GB, 50 GB y backups nocturnos anunciados; solo proyectos open-source activos y **sin oferta comercial en el servidor**, sujeto a stock. **NO-GO** |
| FreeVPS.org | https://www.freevps.org/ | Exige participación previa en foros, sin SLA ni plazo garantizado; prohíbe redistribución comercial y depende de AUP de patrocinadores. Cuba y servicio comercial no confirmados. **NO-GO** |
| FreeRoute | https://freeroute.org/ | Anuncia 5 000 solicitudes/día y plan Free $0 forever **para prototipos y pequeñas aplicaciones**; no se pudo consultar página de términos en esta revisión, ni verificar elegibilidad cubana, uptime o aprovisionamiento. **NO APROBADO** |
| Oracle Cloud Always Free | https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ | Restricciones contractuales respecto a Cuba identificadas en revisiones anteriores. **NO-GO sin permiso expreso** |
| Google Cloud Free | https://docs.cloud.google.com/free/docs/free-cloud-features | Cuenta de facturación y límites de cuota; elegibilidad cubana no confirmada. **NO APROBADO** |

Los recursos y uptime anunciados son afirmaciones de proveedores, **no pruebas independientes** de funcionamiento o de entrega.

## Arquitectura alternativa condicionada
El cotizador debe permanecer independiente de la API de rutas, con interfaz abstracta `routeDistanceMeters(origin, destination)`. Backend autorizado consulta el proveedor sin exponer API keys en frontend; entrada solo almacén y punto de referencia público acordado, **no dirección exacta de cliente**, siempre que el proveedor acepte ese uso. Aplicar rate limit, timeout, circuito de fallos, cache con TTL compatible con términos, versionado de tarifa y distancia, auditoría sin datos personales y `fail-closed` ante ausencia de ruta. No sustituir distancia vial por línea recta ni calcular precio definitivo sin ruta válida. Comprobar cobertura real de La Habana y costos de llamadas de múltiples almacenes. Mantener `commercialQuoteEnabled=false`.

## Requisitos documentales de aprobación de API
1. Permiso escrito para uso comercial por entidad cubana; jurisdicción contractual, tratamiento de datos y subprocesadores.
2. Plan permanentemente gratuito sin tarjeta/cargos automáticos; cuotas por día, por minuto y por almacén, sin sobrecosto.
3. Atribución OSM y condiciones de cache/redistribución.
4. Disponibilidad, términos de terminación, contingencia ante caída y cobertura Habana.
5. Solo después de autorizaciones adicionales: prueba controlada con puntos públicos ficticios, latencia, rutas y errores; no pedidos reales.

## Trabajo efectivamente realizado
Investigación de páginas públicas y redacción de este documento en rama aislada. No se descargó cartografía, ejecutó OSRM, consultó API de rutas, creó cuenta, activó manualmente Actions, generó costo ni accedió a Supabase, staging o producción. No se verificó estado de workflows automáticos disparados por commits.
