# Ejecución Node y bloqueo de recuperación — 2026-11-19

Base e2e901d56c260b4ac75e022f7373b93de430681a, comparación GitHub identical, index.html blob bc167baf595fa3085009b421a12eac08438d1b86.

## Pruebas Node ejecutadas
Se materializó sin descarga el contenido exacto de tests/storage-post-remote-recovery-focal.test.cjs en /mnt/data/enlace-focal/tests. Identidad comprobada con git hash-object: bf644afca7611a7800f838995148225c1bc0d0f4, idéntica al blob del conector GitHub. Comando: node tests/storage-post-remote-recovery-focal.test.cjs; Node v22.16.0; salida **9/9 PASS**, código de salida 0. No se repitieron las 11 pruebas previas. El noveno caso verifica deliberadamente una pérdida por carrera no cooperativa; no es prueba de atomicidad.

## Ejecución de código real extraído y bloqueo en arnés
Se extrajeron literalmente edQueueInventory y deleteProductForever de index.html y se ejecutaron con edApi y localStorage simulados en motor JS aislado. El arnés añadió un gate **externo** tras observar una operación remota ficticia y un error local:
- Cola: una API ficticia, cambio externo fees.delivery=99, alerta, gate pendiente; un segundo intento fue bloqueado por el arnés, no por la aplicación.
- Eliminación: una API DELETE ficticia, fallo quota local, alerta, gate pendiente; un segundo intento fue bloqueado por el arnés, no por la aplicación. Estado local conserva el producto, memoria lo elimina.

Esto demuestra la utilidad del protocolo y también que **la aplicación actual NO implementa el bloqueo**. No se debe atribuir la prevención de reintentos a index.html.

## Validación de las demás rutas
Se mantiene la inspección de las ocho escrituras directas en index.html: edLoadCategories, edLoadInventory, edQueueInventory, dos migraciones, save(), banner y deleteProductForever. El modelo de persistencia por campos había sido probado en Node (11/11 en fase anterior), pero aún **no** está integrado ni verificado ejecutando save/banner/cargas/migraciones reales con el helper. La reconciliación remota real, el bloqueo entre pestañas y Web Locks nativo permanecen PENDIENTES.

## Decisión
No modificar index.html. Integración mínima propuesta: gate de solo escritura de inventario compartido por cola y eliminación, marcado al confirmar API y fallar persistencia local, bloqueo de nuevas escrituras, reconciliación mediante nueva lectura remota autorizada y verificación de snapshots, con mensaje específico para remoto confirmado/local pendiente. Para las otras rutas, usar parche por campos con baseline y rechazo de conflictos, sin atribuir atomicidad. Antes de modificar, ejecutar pruebas focalizadas con funciones reales de todas las rutas, especialmente recuperación y reintentos.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
