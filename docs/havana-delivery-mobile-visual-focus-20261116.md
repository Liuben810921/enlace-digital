# Evidencias visuales móviles focalizadas — 16 noviembre 2026

Base autorizada: `afd07a729e5b8d8a97e87097e42290122ac90787`; rama `plan/havana-osrm-benchmark-offline-20261114`.

## Integridad de archivos
ZIP del commit base suministrado por el propietario. Se verificaron nuevamente los SHA de blobs Git de los archivos extraídos antes de ejecutar:
- `index.html`: `342a73d7698d2b9f5db7234e77d65dd56f6ca517`.
- `experiments/havana-delivery-quote/quote.js`: `39f82bed45f7645b935e5951f559a68af27cdda9`.

## Harness offline
Playwright Python y Chromium local; 360×780 y 390×780, dispositivo móvil/touch y DPR=2. HTML exacto con scripts originales ejecutados por separado en el harness y `localStorage` de memoria (Map) para evitar origen opaco. Peticiones de red abortadas. Datos ficticios de un proveedor y un almacén. Sin modificación del código del repositorio.

## Observaciones verificadas en 360 y 390 píxeles
- Zoom CSS `document.documentElement.style.zoom='200%'`: `documentElement.scrollWidth===documentElement.clientWidth` en ambos anchos.
- Siete campos principales (`edSupplierName`, `edOriginName`, `edOriginType`, `edOriginMunicipality`, `edOriginAddress`, `edOriginLat`, `edOriginLng`) tienen etiqueta `label[for]` y rectángulo visible al 100 y 200 %.
- Controles de edición de proveedor y punto de salida localizados por su nombre accesible `aria-label`; foco programático observado; contorno calculado `outline: solid 3px`.
- Con el botón de editar punto enfocado, `Enter` activa la edición, mantiene el nombre ficticio y traslada el foco a `#edOriginName`.
- No se observaron errores JavaScript.

## Capturas y reproducibilidad
Cuatro capturas locales tomadas durante la ejecución: `visual_360_100.png`, `visual_360_200.png`, `visual_390_100.png`, `visual_390_200.png`. La captura de página completa incluye contenido ajeno al panel de entregas; no debe interpretarse como auditoría integral. El script local `test_visual_focus.py` y el log `visual_results.log` están disponibles en el entorno de pruebas de la conversación; **no se adjuntan binarios ni el script al repositorio**.

## Límites
Esta batería verifica controles seleccionados, no una auditoría exhaustiva de accesibilidad, lectores de pantalla, recorrido secuencial completo de Tab, zoom del navegador nativo ni integración de una sesión administrativa autenticada. `page.set_content` con sustitución de almacenamiento en memoria es un harness aislado. No hubo servicios externos ni operaciones de negocio.

## Decisión
Sin defectos nuevos reproducidos: no se realizaron correcciones de código. Solo se publicó esta evidencia textual. Sin Supabase, staging, producción, pedidos, cartografía, activación de servicios ni costos.
