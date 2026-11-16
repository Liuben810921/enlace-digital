# ENLACE DIGITAL — Chromium móvil con HTML exacto (16 noviembre 2026)

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Commit fuente:** `999d4869fc60c280d2f64273c82a3a5328bbcd12`

## Bloqueante de materialización resuelto

Se encontró en el entorno un ZIP previo del repositorio, cuyo `index.html` tiene Git blob `5585560a6fba8e92800f923a6103a340072f2f47`. Se reconstruyó localmente la versión actual aplicando exactamente las dos modificaciones de interfaz ya publicadas. **`git hash-object index.html` local = `a5d43f47c0fabebc179ee88b0dbd9585730450b8`**, coincidente con el blob que devuelve GitHub para el commit fuente. Tamaño: 352182 bytes. El módulo `quote.js` local también coincide con GitHub: `39f82bed45f7645b935e5951f559a68af27cdda9`.

No hubo descargas de cartografía ni llamadas a servicios externos.

## Procedimiento Chromium y alcance exacto

Se utilizó Playwright con Chromium headless a anchos **360 px** y **390 px**, `is_mobile=True`, `has_touch=True`. Como el navegador bloquea orígenes `file://` y localhost, se usó `page.set_content` con el HTML reconstruido. La etiqueta de script externo fue sustituida **solo en la copia de prueba** por un script inline que contiene los bytes exactos de `quote.js`; no se alteró el contrato. Se inyectó un `localStorage` en memoria antes de evaluar el documento, porque `about:blank` no permite almacenamiento nativo. Para probar formularios administrativos sin autenticar contra servicios reales, se retiró la clase CSS `hidden` del contenedor administrativo **solo en el navegador de prueba** y se invocó `adminTab('delivery')`.

Por estas adaptaciones, se trata de una **prueba funcional de los componentes reales del HTML**, no de una prueba de autenticación, sesión, persistencia real de navegador, despliegue o staging.

## Resultados reproducidos

En ambos tamaños de pantalla se verificó:
1. Renderizado de la pestaña Administración de entregas y el simulador.
2. Alta de proveedor ficticio.
3. Alta de dos almacenes propios con referencias ficticias.
4. Alta de un destino de referencia.
5. Estado `PENDIENTE` sin rutas verificadas.
6. Simulación con dos almacenes (2 y 5 km ficticios): origen más lejano y 1000 CUP de ejemplo a 200 CUP/km.
7. Cambio de tarifa a 250 CUP/km: 1250 CUP de ejemplo.
8. Desactivación del segundo almacén; origen restante de 2 km, mínimo facturable 3 km, 600 CUP con tarifa predeterminada restaurada.
9. Desactivación del proveedor.
10. `document.documentElement.scrollWidth-innerWidth = 0` (sin desbordamiento horizontal).
11. Cero excepciones JavaScript de página y cero alertas inesperadas.

Capturas generadas localmente: `/mnt/data/ed_full_verify/full_mobile_360.png` y `full_mobile_390.png`. No se publicaron en GitHub.

## Observación y pendientes

Al redibujar el panel tras desactivar un almacén, la tarifa ficticia de entrada vuelve al valor por defecto (200 CUP/km). Se verificó este comportamiento. No afecta tarifas operativas ni pedidos; conservar la entrada durante redibujados es una mejora de usabilidad candidata a corrección focalizada.

No se comprobaron todavía zoom al 200 %, teclado, edición de proveedor/almacén, coordenadas inválidas, cuarentena ni persistencia nativa tras recarga. Tampoco se verificaron autenticación administrativa o integración de rutas viales reales.

**Sin cambios en código operativo.** No se modificó Supabase, staging, producción, pedidos, cartografía, servicios o costos. No se ejecutaron auditorías generales.
