# ENLACE DIGITAL — Unificación del cotizador offline en Administración de entregas

**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `ead827a56c75951462e7f046e7409506bc7b59ba`  
**Implementación:** `1db75d63c6cbc64860ee7aa66e5672515cfcf406`

## Cambios concretos

1. `experiments/havana-delivery-quote/quote.js`: conserva la exportación Node CommonJS y añade `window.EDOfflineQuote=Object.freeze({quoteDelivery})` para consumo desde la página.
2. `index.html`: carga el archivo compartido con una etiqueta `script src` relativa antes del script principal.
3. `edDeliveryQuoteDemo(synthetic)`: deja de implementar por su cuenta la selección de origen más lejano y el cálculo de tarifa. Reutiliza `window.EDOfflineQuote.quoteDelivery`, pasando almacenes, proveedores, destino, revisión de contexto y estado de cuarentena.
4. Si no se solicitan distancias ficticias, pasa un arreglo vacío de rutas al contrato y muestra `PENDIENTE`. Si se solicitan, construye en memoria distancias expresamente inventadas; el resultado se muestra como `SIMULACIÓN FICTICIA` y `NO ES TARIFA REAL`.
5. No hay persistencia de las distancias inventadas ni conexión con checkout, servicios de rutas o pedidos.

**Precaución:** las rutas sintéticas se representan internamente como `status:'verified'` únicamente para ejercitar el contrato de demostración; **esto no constituye verificación vial real**. La interfaz nunca presenta una tarifa operativa. La futura fuente confiable de distancias debe separarse de los datos suministrados por el navegador.

## Evidencia recuperada de GitHub

Archivos recuperados en el commit de integración:

| Archivo | Git blob reportado por GitHub |
|---|---|
| `index.html` | `a5d43f47c0fabebc179ee88b0dbd9585730450b8` |
| `experiments/havana-delivery-quote/quote.js` | `39f82bed45f7645b935e5951f559a68af27cdda9` |

Se verificaron **8/8 condiciones estáticas focalizadas** sobre el contenido recuperado: carga de script compartido, invocación real del contrato, eliminación del cálculo duplicado, arreglo vacío de rutas sin simulación, advertencia de tarifa ficticia, exportación para navegador, exportación Node y una sola función controladora.

Se ejecutaron **5/5 comprobaciones locales de comportamiento** y `node --check` sin errores sobre una reconstrucción local del módulo: PENDIENTE sin rutas, origen más lejano, cuarentena, tarifa inválida y ruta incompleta. La reconstrucción no se declara equivalente byte a byte al blob remoto; por ello los resultados locales no sustituyen una prueba sobre los bytes publicados.

## Pruebas visuales

Chromium está instalado localmente, pero no se pudo obtener una copia exacta del HTML remoto en el contenedor: la descarga directa de GitHub no tuvo conectividad y el conector GitHub permite leer el contenido pero no materializarlo directamente en el sistema local. **No se ejecutaron pruebas visuales Chromium de la página exacta.** Permanecen pendientes: móvil 360–390 px, zoom 200 %, teclado, creación/desactivación de almacenes/proveedores, destino de referencia, estado PENDIENTE, simulación, cuarentena y ausencia de cambios en carrito.

## Límites respetados

No se ejecutaron auditorías generales, GitHub Actions, PostgreSQL ni OSRM. No se accedió ni modificó Supabase, staging, producción, pedidos reales ni inventario. Sin descargas cartográficas, servicios externos ni costos.

## Siguiente paso

Materializar la versión exacta del HTML y su dependencia local en un entorno de navegador autorizado, ejecutar la matriz móvil focalizada y corregir solo fallos reproducidos. No activar cotización real sin fuente vial confiable y autorización específica.
