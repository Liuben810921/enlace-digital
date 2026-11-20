# Transferencia selectiva de almacenes entre proveedores — 2026-11-19

Base d605fbd741e9a5e4af9eeeac6d03be3f6f255cf0, comparación inicial identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Función operativa
Commit 992a17a1340e95fae63f9b38bccd64fecd2be629, index.html blob 4281f45b5038aec6bc5b1656acb8e007c4a3beaf.

edDeliverySupplierTransferWarehouses permite introducir una lista de IDs de almacenes separados por comas; una respuesta vacía selecciona todos. Se valida que cada ID pertenezca al proveedor de origen, que no haya duplicados ni lista vacía, y se comprueban las asociaciones solo de los almacenes seleccionados. La confirmación indica el número seleccionado. Se mantienen las validaciones existentes de inventario, proveedor activo y datos sin cambios antes de persistir. Los almacenes no seleccionados permanecen con el proveedor original.

## Verificación focalizada
Se extrajo y ejecutó la función real con datos ficticios y dependencias simuladas:
1. Selección w1: true, 1 escritura, solo w1 cambia de proveedor.
2. Selección w1,w1: false, 0 escrituras.
3. Selección w1 con producto asociado a w1: false, 0 escrituras.
4. Selección vacía: true, 1 escritura, w1 y w2 cambian de proveedor.
**4/4 escenarios esperados.** No se ejecutó navegador ni batería integral.

## Limitaciones
La transferencia no mueve productos asociados; requiere reasignarlos o desvincularlos primero. Persistencia compartida insegura: PENDIENTE, investigación cerrada. Las verificaciones previas no garantizan atomicidad entre pestañas. Sin despliegue.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
