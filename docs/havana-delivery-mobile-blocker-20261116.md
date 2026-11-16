# Chromium móvil focalizado — estado verificable (16 noviembre 2026)

Base exacta de esta continuación: `8ec53c9c2583f7a607027c02944a7bf4d097361f`. Se verificó con GitHub compare que la rama `plan/havana-osrm-benchmark-offline-20261114` estaba idéntica a esa base antes de este informe.

## Identidad de los archivos fuente comprobada en GitHub
- `index.html`: Git blob `342a73d7698d2b9f5db7234e77d65dd56f6ca517`; contenido UTF-8 recuperado mediante conector GitHub.
- `experiments/havana-delivery-quote/quote.js`: Git blob `39f82bed45f7645b935e5951f559a68af27cdda9`; recuperado mediante conector GitHub.

## Regresión de tarifa ficticia — verificación estática, NO Chromium
En el HTML de la rama se confirmó: borrador inicial `edQuoteDemoRateDraft='200'`, actualización con `oninput="edQuoteDemoRateRemember(this)"`, y reconstrucción del campo desde `esc(edQuoteDemoRateDraft)`. La corrección es coherente con conservar el borrador durante redibujados. **No se ha ejecutado una regresión en Chromium**; no se certifica funcionalmente.

## Bloqueo de ejecución local
El contenedor de esta sesión carece de copia montada del repositorio y de ZIP previo. Se intentó obtener el HTML exacto desde `raw.githubusercontent.com` mediante HTTPS; falló por `NameResolutionError` (resolución DNS). El conector GitHub sí permitió inspeccionar el contenido, pero no entregó un archivo al contenedor donde corre Playwright. No se utilizó una versión aproximada ni se reconstruyó el HTML con fragmentos.

## Pruebas solicitadas que permanecen sin ejecutar
- Tarifa ficticia tras redibujar Administración de entregas.
- Edición de proveedores y almacenes.
- Coordenadas inválidas.
- Cuarentena y recuperación.
- Teclado y zoom al 200 %.

La inspección estática constató que existen funciones de edición y guardas de cuarentena y validación de rangos, **sin inferir que pasen pruebas de navegador**.

## Siguiente paso verificable
Materializar en el entorno de Playwright los dos archivos con los blobs SHA indicados, comprobar `git hash-object` de ambos y ejecutar únicamente la batería Chromium móvil solicitada. No publicar correcciones adicionales sin defecto reproducido.

No hubo acceso a Supabase, staging, producción, pedidos, cartografía ni servicios operativos; no se activaron recursos facturables.
