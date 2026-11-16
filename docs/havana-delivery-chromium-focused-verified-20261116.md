# Pruebas Chromium móviles focalizadas — 16 noviembre 2026

Base autorizada: `1c4519a926e3d33718d39622eec48ade451b30ca`; misma rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Fuente exacta y hashes
ZIP aportado por el propietario, correspondiente al commit autorizado. Se extrajeron sin modificar los bytes de los archivos y se calculó SHA-1 Git sobre `blob <bytes>\0<contenido>`:
- `index.html`: 352443 bytes, SHA `342a73d7698d2b9f5db7234e77d65dd56f6ca517`.
- `experiments/havana-delivery-quote/quote.js`: 2409 bytes, SHA `39f82bed45f7645b935e5951f559a68af27cdda9`.

## Entorno reproducido
Chromium 144.0.7559.96 mediante Playwright Python, viewport 360×780 y 390×780, mobile=true, touch=true, DPR=2. Se cargó el HTML exacto mediante `page.set_content`, retirando únicamente las etiquetas `<script>` del HTML **en el harness** para insertar por separado el `quote.js` exacto y el JavaScript inline exacto; se sustituyó `localStorage` por un Map en memoria debido al origen opaco de `set_content`. Todas las peticiones de red se abortaron. El código del repositorio no fue modificado.

## Resultados observados en ambos viewports
1. Tarifa ficticia: rellenar `#edQuoteDemoRate` con 250 y llamar `adminTab('delivery')` devuelve 250 tras redibujado: PASS.
2. Proveedor ficticio: alta, edición por diálogo y lectura posterior de `Proveedor Editado`: PASS.
3. Almacén ficticio: latitud 95 rechazada sin guardar; latitud 23.1/longitud -82.4 aceptadas; edición posterior leída como `Almacén Editado`: PASS.
4. Destino ficticio: latitud 91 rechazada sin guardar: PASS.
5. Cuarentena: bloqueo de edición, comprobación `edDeliveryIsQuarantined()===true` y recuperación `edDeliveryRecoverQuarantine()===true`: PASS.
6. Teclado: campo de proveedor enfocado y entrada `Teclado` observada: PASS.
7. Zoom CSS `document.documentElement.style.zoom='200%'`: `scrollWidth===clientWidth` (360/360 y 390/390): PASS para ausencia de desbordamiento horizontal global.
8. Errores JavaScript observados: ninguno.

## Límites
Las pruebas no son sesiones autenticadas de administración real ni pruebas de integración backend. La sustitución de almacenamiento por Map y la inyección separada de scripts son condiciones del harness, no modificaciones del código fuente. Zoom CSS no sustituye la inspección visual de cada control, la navegación completa por teclado ni la accesibilidad asistida. No se hicieron capturas ni pruebas de redes/servicios.

## Decisión
No se reprodujeron defectos nuevos en esta batería: **ninguna corrección de código**. Evidencia documental únicamente. No se accedió a Supabase, staging, producción, pedidos, cartografía ni servicios externos; no se generaron costos.
