# Corrección focalizada: selección masiva de almacenes

Base `8e14b13b0caa60660c9718a11b9cb5179c701e59`; comparación con rama `identical`. Commit de código `48ac867e33a897b9f9b050e3f37994139ccaf430`.

## Defecto identificado en el código

`edDeliveryOriginsPanel()` anida dentro de `edOriginBulkSelection` las casillas de selección de almacenes (`edOriginBulkCheck`) y, para almacenes con productos, casillas de productos del fieldset `edReassignProducts-*`. Los tres manejadores de operaciones masivas usaban `panel.querySelectorAll('input[type="checkbox"]:checked')`, que podía mezclar IDs de productos con IDs de almacenes y rechazar selecciones válidas como inexistentes.

## Corrección

`edDeliveryOriginsDeleteSelected`, `edDeliveryOriginsSetSelectedActive` y `edDeliveryOriginsMoveSelected` utilizan ahora `panel.querySelectorAll('.edOriginBulkCheck:checked')`. No se modificaron las reglas de dependencias ni la persistencia.

## Verificación efectivamente realizada

Se volvió a leer `index.html` de la rama tras el commit, blob `8eeb4a2f53519ba2eb612aafa73edc2f0e78888e`. **3/3 aserciones estáticas**: cada uno de los tres manejadores contiene el selector específico y ya no contiene el selector genérico. Se comprobó además que el panel conserva los controles de productos anidados.

**Pendiente**: pruebas dinámicas de DOM sintético para verificar selección de almacenes con productos marcados, y casos de rechazo por dependencias. No se afirma ejecución dinámica ni navegador. La persistencia compartida insegura y la atomicidad entre pestañas siguen **PENDIENTES**.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
