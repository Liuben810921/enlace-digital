# Conflictos sintéticos entre pestañas — 2026-11-19

Base 59d6bfde001cbe373f53924efe657bd763df654a; rama plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Transferencias
Se extrajeron las funciones reales edDeliverySupplierTransferWarehouses y edDeliveryPersistAndInvalidate con almacenamiento ficticio compartido entre dos contextos:
- estable: true, 1 escritura, almacén pasa s1→s2;
- inventario modificado en otra pestaña antes de transferir: false, 0 escrituras, almacén permanece s1;
- inventario modificado en confirmación: false, 0 escrituras, almacén permanece s1;
- almacén modificado en confirmación: false, 0 escrituras propias; conserva modificación ajena a s2.
4/4 resultados esperados. Las comprobaciones de inventario compartido ya estaban presentes; no se modificó esa función.

## Defecto reproducido en cola
Con edQueueInventory real, primera pestaña inicia guardado y espera API ficticia; segunda pestaña cambia localStorage.enlace_demo_v1 a B-other-tab. Antes de la corrección, la primera terminaba con true y sobrescribía el valor con A-new.

## Corrección
Se captura sharedAtEnqueue mediante localStorage.getItem al encolar y se compara antes de escribir el estado persistido. Ante discrepancia se rechaza el guardado local y se mantiene el snapshot previo. Se conserva el contador de pendientes con finally.

## Pruebas posteriores
- sin conflicto: resultado true, una llamada API, contador 0, localStorage A-new, snapshot A-new;
- conflicto de otra pestaña: resultado false, una llamada API ficticia, contador 0, localStorage B-other-tab conservado, snapshot A-old conservado.
2/2 resultados esperados.

## Limitaciones
No hay compare-and-swap atómico en localStorage: otra pestaña puede escribir entre comparación y setItem. La corrección tampoco deshace una escritura remota ya realizada. La sincronización entre clientes requiere control de versiones y escritura condicional del lado servidor; no se implementó. No se ejecutó navegador ni batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
