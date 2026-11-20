# Administración de entregas — corrección focalizada y estado — 2026-11-19

Base 1a74603ebab48d575a9a2d17ca2aa8f3d3ea5ceb; comparación initial identical. Rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto reproducido y corrección
En index.html, edDeliveryDestinationEdit y edDeliveryDestinationDelete ya verificaban edDeliveryIsQuarantined() al entrar, pero edDeliveryDestinationSave carecía de la misma guarda. Se añadió exclusivamente `if(edDeliveryIsQuarantined())return false;` al inicio de edDeliveryDestinationSave.

Commit de código: 7ac6b598768a931ef5cc7d09d46563e2c75565cf, blob HTML 07615b2e112f46422f6de02dd140433757194423.

## Prueba focalizada de función real
Se extrajo la función modificada, se compiló con new Function y se ejecutó en motor JS aislado con dependencias DOM/almacenamiento simuladas:
- Cuarentena activa: retorno false, 0 escrituras.
- Cuarentena desactivada: retorno true, 1 escritura simulada.
- No se ejecutaron otras baterías ni navegador. No afirmar validación integral.

## Estado
Investigación de persistencia cerrada. No se modificó la lógica insegura de persistencia compartida. Rutas dependientes de reconciliación remota, bloqueo entre pestañas o persistencia por campos: PENDIENTE. No se activaron servicios, pedidos ni producción. Próximas tareas: funcionalidades operativas independientes con correcciones concretas y pruebas nuevas mínimas.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
