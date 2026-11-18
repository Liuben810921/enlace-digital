# Alternativa sin servidor propio: proveedor de rutas con plan gratuito (2026-11-18)

Base: `6146a0b0eec8f5d1f1ec19514a8197a6e5538c8c`; rama `plan/havana-osrm-benchmark-offline-20261114`. Nueva decisión del propietario: seguir desarrollando sin servidor local; se autoriza **investigar** opciones de servicio, no crear cuentas, activar APIs, generar costos ni modificar sistemas.

## Comparación documental de condiciones públicas
- **Geoapify**, https://www.geoapify.com/pricing/ : Free 3.000 créditos/día, hasta 5 solicitudes/s, sin tarjeta de crédito; **uso comercial y producción expresamente permitidos** con límites y atribución de Geoapify/OSM. https://apidocs.geoapify.com/docs/route-planner/routing/ : en ruta sencilla, 1 crédito por par de puntos y recargos según opciones. **Primera opción para piloto condicionado.**
- **GraphHopper**, https://www.graphhopper.com/pricing/ y https://www.graphhopper.com/terms/ : Free 500 créditos/día, no comercial en producción por defecto; desarrollo permitido, producción comercial solo tras consulta/acuerdo. No seleccionar para operación comercial gratuita.
- **Google Routes**, https://developers.google.com/maps/documentation/routes/usage-and-billing : exige habilitar facturación y clave/OAuth, aunque existen franquicias gratuitas; no satisface política de cero riesgo de cobro sin autorizaciones y controles.
- **openrouteservice**, https://openrouteservice.org/plans/ y https://giscience.github.io/openrouteservice/frequently-asked-questions : alternativa gratuita con cuotas; condiciones comerciales específicas y cobertura Cuba pendientes de verificar antes de elegir.

## Arquitectura provisional recomendada
GitHub Pages (cliente) → componente confiable de ENLACE DIGITAL con clave privada y límites → Geoapify Routing API → validación de ruta, origen efectivo, versión y distancia → contrato de cotizador existente. **Nunca exponer API key en HTML, JavaScript público o GitHub Pages.** No usar directamente la API desde navegador en un flujo de cobro. Un plan de API gratuito no implica que el componente seguro sea gratis; **costo cero extremo a extremo aún no demostrado**.

## Puertas necesarias antes de activar
1. Confirmar elegibilidad del plan gratuito para la entidad y acceso desde Cuba; revisar términos, atribución, cuotas, retención, privacidad y cambios de precio.
2. Confirmar mecanismo de clave privada y componente confiable existente, con límites duros que impidan sobrecostos. Sin infraestructura gratuita verificada, no declarar servicio operativo.
3. Con autorización independiente para crear cuenta y efectuar consultas, medir 8–12 rutas con **puntos públicos**, sentidos inversos, centro/periferia, NoRoute; contrastar distancias con referencia independiente. **Cobertura de La Habana no probada**.
4. Mantener `PENDIENTE` ante fallos o rutas no verificadas; no tocar checkout, pedidos ni cobros reales.
5. Mantener OSRM autohospedado como opción futura, evitando acoplar el cotizador a un proveedor único.

## Estado
Investigación y recomendación documental exclusivamente. **Sin cuenta, API key, llamadas de rutas, modificaciones operativas, despliegues ni gastos.** No se accedió a Supabase, staging, producción, clientes o pedidos. El PBF verificado queda disponible para el futuro laboratorio OSRM; no es necesario para una API alojada.
