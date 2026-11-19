# Ciclo de carga de inventario y señal edInventoryLoaded — 2026-11-19

Base dd22791fb14befce85f98734a3cc4b974e40047b; rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Hallazgo y corrección
edLoadInventory no limpiaba edInventoryLoaded al comenzar una recarga. Si una carga previa había finalizado, una recarga en curso o fallida podía conservar true y permitir transferencias con inventario obsoleto. edInit limpiaba state.products tras fallo pero tampoco restablecía explícitamente la señal.

Ahora edLoadInventory inicia con edInventoryLoaded=false y solo marca true tras recibir array y validar IDs enteros seguros no negativos, unicidad y origen_producto reconocido. edInit vuelve a establecer false al capturar un fallo de carga.

## Pruebas focalizadas
Se ejecutó la función real edLoadInventory extraída de index.html con respuestas de API, estado y almacenamiento simulados. Los seis escenarios arrancan con señal true para reproducir recarga:
- respuesta válida: resuelve, señal true, una persistencia local simulada;
- respuesta no array: rechaza, señal false, cero escrituras;
- IDs duplicados: rechaza, señal false, cero escrituras;
- ID inválido: rechaza, señal false, cero escrituras;
- origen_producto inválido: rechaza, señal false, cero escrituras;
- error de red: rechaza, señal false, cero escrituras.

6/6 resultados esperados. No se ejecutaron llamadas reales a la API.

## Limitaciones
La API de inventario consulta select=* sin paginación explícita. La respuesta podría estar limitada por el servidor y no existe un metadato verificable de completitud; edInventoryLoaded indica carga validada, no certifica exhaustividad remota. Queda pendiente diseñar una comprobación de paginación/completitud sin acceder a Supabase. También pendiente test de transferencia durante promesa de recarga, almacenamiento local fallido y concurrencia entre pestañas. No se ejecutó batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
