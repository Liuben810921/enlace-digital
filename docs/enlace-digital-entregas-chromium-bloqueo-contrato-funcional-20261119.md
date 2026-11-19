# ENLACE DIGITAL — bloqueo de Chromium móvil y prueba funcional focalizada
Fecha: 2026-11-19. Base y HEAD al inicio: `da7590faaa52cce6de057ab2d267745caad112f2` (comparación GitHub: identical).

## Materialización exacta sin descargas
Se verificó el blob Git de `index.html` `4261e365dfbd2ac9bd0ea7e64b5633e781208d85`. Una copia local anterior tenía blob `342a73d7698d2b9f5db7234e77d65dd56f6ca517`; se aplicó exclusivamente el cambio de destinos ya publicado, y el blob reconstruido coincidió exactamente con `4261e365dfbd2ac9bd0ea7e64b5633e781208d85`. El contrato `experiments/havana-delivery-quote/quote.js` se reconstruyó localmente y su blob coincidió exactamente con `39f82bed45f7645b935e5951f559a68af27cdda9`. No hubo descarga de red.

## Chromium móvil — bloqueo reproducido
- Chromium está instalado en `/usr/bin/chromium`; Playwright Python está instalado.
- Se intentó cargar el HTML exacto en contexto móvil de 390 × 844, pantalla táctil, mediante `file://`: `net::ERR_BLOCKED_BY_ADMINISTRATOR`.
- Se intentó una segunda carga mediante interceptación Playwright `route.fulfill` de `http://127.0.0.1:8765/index.html`, sirviendo exclusivamente bytes locales, con todas las demás peticiones abortadas: `net::ERR_BLOCKED_BY_ADMINISTRATOR`.
- No se alcanzó la ejecución del DOM ni de los formularios. **No se realizaron pruebas funcionales reales de interfaz móvil ni se generaron capturas nuevas válidas**. No se eludió la restricción del navegador.

## Única comprobación funcional alternativa
Se ejecutó Node sobre el contrato exacto `quote.js`, con tres casos sintéticos:
1. Dos almacenes propios con distancias ficticias 4 km y 8 km, tarifa ficticia 200 CUP/km, revisión 1: `COTIZACION_SIMULADA`, almacén más lejano `b`, 1600 CUP (**PASS**).
2. Ruta faltante para uno de los almacenes: `PENDIENTE`, `ROAD_DISTANCE_MISSING`, sin importe (**PASS**).
3. Cuarentena activa: `PENDIENTE`, `QUARANTINE`, sin importe (**PASS**).

Estas son **pruebas funcionales reales del contrato Node**, no pruebas Chromium ni de integración web. No se detectaron fallos reproducibles que justificaran cambios de código.

## Próximo paso útil
Resolver por una vía autorizada la restricción de navegación de Chromium en el entorno de pruebas y ejecutar una única batería móvil de alta de proveedores, almacenes, destinos, invalidación y cotización ficticia. No reabrir auditorías generales ni PostgreSQL. Mantener `PENDIENTE` para distancias no verificadas.

Restricciones: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
