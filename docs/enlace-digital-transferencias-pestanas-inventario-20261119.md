# Transferencias entre pestañas: comparación de inventario compartido — 2026-11-19

Base 59d6bfde001cbe373f53924efe657bd763df654a. Rama plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical.

## Riesgo reproducible
Dos pestañas poseen edInventorySnapshot y edInventoryPendingSaves independientes. La pestaña A puede conservar una instantánea local válida mientras B cambia el inventario compartido en localStorage. La guardia previa solo examinaba el estado de A y no advertía esa divergencia.

## Corrección
edDeliverySupplierTransferWarehouses exige que el inventario compartido en enlace_demo_v1 sea JSON válido con products array y que JSON.stringify(products) coincida con edInventorySnapshot. Repite la comparación inmediatamente después de confirm, antes de persistir almacenes. Falla cerrado si no puede comprobarse.

## Pruebas focalizadas
Funciones reales de transferencia y persistencia extraídas de index.html con almacenamiento simulado:
- estado compartido coincidente: true, 1 escritura;
- cambio en otra pestaña antes de iniciar: false, 0 escrituras;
- cambio en otra pestaña durante confirmación: false, 0 escrituras;
- JSON compartido inválido: false, 0 escrituras.

4/4 resultados esperados.

## Limitaciones
La comparación de localStorage no es una operación compare-and-swap atómica: otra pestaña puede escribir después de la última comprobación. Tampoco detecta cambios remotos no reflejados localmente. No se verificó mediante navegador multipestaña real ni se probaron colisiones de escrituras concurrentes en la cola de inventario. La política fail-closed puede impedir transferencias cuando no exista copia local comprobable. Garantías fuertes exigirían versionado y comprobación condicional en servidor.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
