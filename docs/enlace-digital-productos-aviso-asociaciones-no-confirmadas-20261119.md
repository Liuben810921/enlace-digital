# ENLACE DIGITAL — Resultado explícito del guardado de asociaciones al crear productos
Fecha: 2026-11-19. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base solicitada `7fdd0bb14ed304c3085ac48fd4fcd71e222522fd`. Al inicio la rama estaba **ahead** en dos commits respecto a la base; se conservó su HEAD existente, sin revertir ni reescribir cambios.

## Defecto funcional
`createProduct` llamaba `edProductOriginsSave(createdId,...)` sin comprobar su retorno. Aunque el guardado de asociaciones devolviera `false`, el flujo cerraba normalmente sin informar de que la asociación no se había confirmado.

## Corrección
Se captura el retorno en `originsSaved`. Al finalizar el flujo, si es `false`, se muestra una advertencia precisa: el producto fue creado pero sus almacenes asociados **NO** quedaron confirmados, y se indica revisar desde Inventario. El caso exitoso mantiene el flujo normal. No se inventa rollback del producto ya creado.

## Pruebas focalizadas
Fuente GitHub `index.html`, blob `f01279c1f63495c967fefcd2342637843245627b`. Ejecución aislada de la función real `createProduct` con DOM, persistencia y productos ficticios:
- Asociación falla: se crea un producto ficticio, se abre Inventario y se muestra advertencia explícita — **PASS**.
- Asociación correcta: se crea un producto ficticio, se abre Inventario y no se muestra advertencia — **PASS**.
- Parser V8 del script inline completo — **PASS**.

**Límite:** esta corrección mejora la visibilidad del estado parcial, pero no convierte el alta en una transacción atómica. La sincronización real del inventario, las pruebas Chromium móvil y el flujo integrado siguen pendientes. No se ejecutaron operaciones reales de inventario, Supabase, GitHub Actions, staging, producción, pedidos, descargas ni despliegues. No hubo costos. La batería integral queda reservada para antes de activar, con autorización.
