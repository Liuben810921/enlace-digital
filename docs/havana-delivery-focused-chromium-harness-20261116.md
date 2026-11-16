# ENLACE DIGITAL — Verificación móvil focalizada del cotizador offline

**Referencia:** `d179a9cfcf286985c30c672f5ba6782a5c09a63f`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`

## Verificación de identidad de archivos

- `experiments/havana-delivery-quote/quote.js`: GitHub reporta blob `39f82bed45f7645b935e5951f559a68af27cdda9`. Se reconstruyó el archivo en el contenedor a partir de una copia anterior y de la modificación exacta de exportación; `git hash-object` local devolvió **el mismo blob**. El módulo probado sí coincide byte por byte con el publicado.
- `index.html`: GitHub reporta blob `a5d43f47c0fabebc179ee88b0dbd9585730450b8`, 351035 caracteres. No se logró materializar el archivo completo localmente: la descarga directa desde `raw.githubusercontent.com` falló por resolución DNS. **No existe verificación byte a byte local de index.html ni prueba Chromium de la página completa.**

## Pruebas realmente ejecutadas

- `node --test` sobre las 20 pruebas focalizadas del contrato: **20/20 OK**.
- Chromium headless mediante Playwright, anchos **360 px y 390 px**, emulación móvil/táctil: **2/2 escenarios OK** en un **harness HTML aislado creado para la prueba**, con el `quote.js` exacto publicado. Cada escenario verificó:
  - PENDIENTE sin rutas;
  - simulación ficticia con dos orígenes (2 y 5 km), seleccionando el más lejano, 1000 CUP de ejemplo a 200 CUP/km;
  - cambio de tarifa ficticia a 250 CUP/km, resultado 1250 CUP;
  - ausencia de desbordamiento horizontal;
  - ausencia de errores JavaScript de página.
- Capturas locales: `/mnt/data/ed_mobile_verify/mobile_360.png` y `mobile_390.png` (capturas del harness, **no de la tienda**).

Chromium bloqueó inicialmente tanto `file://` como el servidor `127.0.0.1` con `ERR_BLOCKED_BY_ADMINISTRATOR`. Se usó `page.set_content` y `page.add_script_tag(content=...)` sin red. Este procedimiento permitió ejecutar las pruebas aisladas; **no equivale a cargar la página real ni a verificar sus formularios de proveedores, almacenes y destinos**.

## Defectos y cambios

No se reprodujeron defectos del contrato en estas pruebas; **no se modificó código operativo ni se añadieron auditorías**. Las restricciones del navegador y de materialización son bloqueantes de prueba, no fallos comprobados de la tienda.

## Pendientes precisos

1. Obtener `index.html` exacto en un entorno que permita materialización y ejecutar pruebas de la pestaña Administración de entregas con Chromium móvil.
2. Verificar realmente alta/edición/desactivación de proveedores, almacenes y destinos, cuarentena, persistencia local, zoom 200 % y teclado.
3. Confirmar integración del script compartido en despliegue aislado autorizado y evitar cotizaciones reales hasta disponer de distancias viales de fuente confiable.

## Alcance

No se accedió ni modificó Supabase, staging, producción, pedidos, inventario real, cartografía, OSRM o servicios externos. Sin costos. No se ejecutaron GitHub Actions ni auditorías generales.
