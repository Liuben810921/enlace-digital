# Paginación por cursor y transferencias durante recarga — 2026-11-19

Base ccc3129cd3fd351eb69bfb709518808c285cd51a; rama plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Problema y solución
Con limit/offset, eliminar un registro de una página anterior desplaza los siguientes y puede omitir uno sin producir IDs duplicados ni desorden. Se reemplazó offset por cursor id=gt.<ultimo_id> con order=id.asc y limit=500. Esto elimina la omisión por desplazamiento causada por eliminaciones anteriores al cursor; no garantiza instantánea transaccional.

## Evidencias sintéticas
Se ejecutó la función real edLoadInventory con API ficticia:
1. Primera página 1..500, segunda 502: consulta id=gt.500, 501 registros totales, éxito; reproduce escenario de eliminación intermedia sin desplazamiento.
2. Inserción detrás del cursor: la consulta id=gt.500 no detecta el nuevo ID menor o igual a 500. Limitación reconocida.
3. Fallo de segunda página: rechaza y deja edInventoryLoaded=false.
4. Página corta válida: acepta.
5. Promesa de carga pendiente: edInventoryLoaded=false hasta resolución.
Se ejecutó adicionalmente la función real edDeliverySupplierTransferWarehouses junto con edDeliveryPersistAndInvalidate usando edInventoryLoaded=false: devuelve false y cero escrituras.

## Límites
La inserción de IDs anteriores al cursor y las modificaciones concurrentes de filas ya leídas no se detectan; para garantía fuerte se requiere snapshot/versionado del servidor. Las pruebas son sintéticas, sin navegador ni Supabase. No se ejecutó batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
