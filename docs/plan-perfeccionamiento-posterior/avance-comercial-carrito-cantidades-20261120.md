# ENLACE DIGITAL — avance comercial focalizado (2026-11-20)

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base: `5f5b367bb8279ede6cefbeaded55dce72bcbd353`; comparación inicial: identical.

## Defecto funcional comprobado por inspección del código exacto
`canOrder(p,n,color)` no validaba que `n` fuera entero positivo y seguro. En particular, para productos de proveedor la comprobación devolvía verdadero sin inspeccionar `n`. El formulario de detalle convertía entradas inválidas con `Number(el.value)||1` y podía producir cantidades no seguras. El carrito no debe aceptar cantidades inválidas.

## Corrección
`index.html`: `canOrder` rechaza cantidades que no sean enteros seguros positivos, antes de evaluar proveedor o stock. `addDetailToCart` rechaza entradas inválidas en vez de normalizarlas silenciosamente. Se conserva la validación de stock existente y el resto de funciones.

## Verificación realmente realizada
Se volvió a obtener el archivo exacto desde GitHub, blob `a5292555d3cb3fea6dd0db4fdf5f43eaf5b41641`. Cinco comprobaciones focalizadas sobre código nuevo y rutas existentes: 5/5. Son comprobaciones de presencia e integración textual, no ejecución de navegador ni de checkout.

## Bloqueantes para lanzar
Conectar y verificar de manera autorizada autenticación, persistencia real de inventario, carrito/pedidos y pagos; ejecutar pruebas funcionales móviles mínimas y comprobar el estado de la infraestructura. No se afirma que el lanzamiento esté listo.

## Mejoras posteriores
Pruebas exhaustivas de escenarios infrecuentes, refinamientos visuales y optimizaciones no críticas pueden quedar para después del lanzamiento, sin comprometer datos ni transacciones.

Sin Supabase, staging, producción, pedidos reales, despliegues, servicios externos adicionales ni costos.
