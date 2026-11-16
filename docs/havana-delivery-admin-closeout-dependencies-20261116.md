# ENLACE DIGITAL — cierre técnico delimitado de Administración de entregas (16-11-2026)

**Base:** `bd2a94653387e9a4eaad123d9cec063168201e5e`. **Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`. Solo documentación y comprobación offline focalizada; no se abre memoria geográfica ni se repiten auditorías generales.

## Fuentes exactas
ZIP del commit `1c4519a926e3d33718d39622eec48ade451b30ca` proporcionado por el propietario, que contiene los archivos funcionales vigentes en la rama posterior (los commits intermedios hasta la base fueron documentales). Se extrajeron y verificaron blobs Git:
- `index.html`: 352443 bytes; `342a73d7698d2b9f5db7234e77d65dd56f6ca517`.
- `experiments/havana-delivery-quote/quote.js`: 2409 bytes; `39f82bed45f7645b935e5951f559a68af27cdda9`.
- `experiments/havana-delivery-quote/quote.test.js`: 2988 bytes; `f637eddf9963c658c2c43418e7a894ce63e0fd06`.

Se revisaron selectivamente `docs/havana-delivery-functional-resumption-20261116.md`, `docs/havana-delivery-shared-quote-ui-20261116.md`, `docs/design/delivery-origin-map-distance-plan-2026-11-13.md`, `docs/havana-next-block-osm-osrm-dependencies-no-cost-20261115.md` y `docs/audits/havana-osrm-offline-acceptance-and-real-route-plan-2026-11-14.md`.

## Comprobación ejecutada
`node --test experiments/havana-delivery-quote/quote.test.js` sobre bytes exactos del ZIP: **20 pruebas, 20 PASS, 0 FAIL**. Esto acredita el contrato de simulación aislado, no distancias reales ni conexión con checkout. Las pruebas Chromium móviles y visuales ya superadas se conservan como evidencias previas sin repetición.

## Cierre por componentes

| Componente | Estado delimitado | Requisito pendiente real |
|---|---|---|
| UI móvil de proveedores y almacenes | Comportamiento focalizado validado en Chromium offline, con datos ficticios | Persistencia compartida y permisos en entorno autorizado; no demostrados |
| Destinos y coordenadas | Validaciones locales y demostración esquemática | Geocodificación/ubicación vial confiable; no equivale a ruta |
| Orígenes por producto | Prototipo local de asociaciones y selección efectiva | Integración autoritativa con disponibilidad y origen realmente utilizado por cada línea |
| Cotizador compartido | 20/20 pruebas del contrato offline; selecciona el origen más lejano entre elegibles y exige rutas por cada origen | Distancias viales verificadas desde fuente confiable y revisión de contexto; no aceptar `verified` del navegador como evidencia |
| Política de tarifa | Mínimo de 3 km, tarifa parametrizable y tarifa especial explícita en prototipo | Aprobar reglas completas de productos mixtos, promociones y gratuidad en integración real |
| Persistencia/versiones | Prototipos y planes offline | Control transaccional y caducidad/invalidez por cambios de cesta, dirección, almacén, tarifa o cartografía |
| Mapa/rutas | Diseño y validadores offline, no servicio vial | Fuente OSM/alternativa con cobertura, licencia, atribución, recursos, costos y calidad medidos, con autorizaciones independientes |
| Checkout y cobro | Desconectados de este prototipo | Integración controlada posterior, sin activar pedidos reales y sin incluir mensajería CUP en total USD |

## Dependencias estrictas para la futura integración de rutas
1. **Definir y validar origen efectivo y destino**, con identidad estable, coordenadas y elegibilidad; no asumir que todos los almacenes disponibles suministran la cesta.
2. **Obtener evidencia vial confiable por cada origen efectivo**: proveedor, perfil, versión de mapa, distancia, vigencia, procedencia y política de errores. Distancia en línea recta y coordenadas solas no bastan.
3. **Aplicar cotización en un componente confiable** con revisiones de cesta/destino/orígenes/tarifa; cambios o rutas ausentes deben devolver `PENDIENTE` sin importe.
4. **Verificar condiciones de uso y recursos** de datos cartográficos/OSRM antes de descargas o alojamiento; costo cero no está demostrado.
5. **Solicitar autorizaciones separadas** para cartografía, backend, persistencia compartida y pruebas integradas. No activar operaciones reales sin ellas.

## Decisión de alcance
**Cerrado para este bloque:** verificación focalizada del prototipo local y documentación de límites. **No cerrado para producción:** rutas reales, datos compartidos, integración de checkout y cobro. No se reproduce defecto nuevo: **cero cambios de código**. No implementar memoria geográfica adicional. No se consultaron ni alteraron Supabase, staging, producción, pedidos, cartografía ni servicios externos; no se generaron costos.
