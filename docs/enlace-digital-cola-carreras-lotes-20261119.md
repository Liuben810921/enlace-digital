# Cola de inventario: carreras entre lotes y pestañas — 2026-11-19

Base b141fbaf1c3a5837e73d1f0879b95adf02c497a2; rama plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Defecto reproducido
Dos llamadas a edQueueInventory en la misma pestaña, primero con name=first y luego name=second, antes de resolver la cola:
- se enviaban ambos lotes a la API ficticia;
- el primero escribía en localStorage el estado actual second, no el target first;
- el segundo fallaba por comparación con sharedAtEnqueue;
- el snapshot terminaba first y localStorage second.
Era un falso conflicto y una divergencia local.

## Corrección
Cada lote persiste {...state,products:target} y no el state.products mutable del momento de finalización. Se incorporó edInventoryQueueWriteVersion y edInventoryLastQueueWrite para aceptar únicamente escrituras locales propias de lotes anteriores al mismo tiempo que se rechazan cambios ajenos detectables. El contador de pendientes conserva finally.

## Pruebas sintéticas focalizadas posteriores
Función real edQueueInventory extraída de index.html con API y almacenamiento ficticios:
- dos lotes: resultado true, llamadas first/second, contador 0, localStorage second, snapshot second;
- otra pestaña modifica almacenamiento mientras API está pendiente: resultado false, contador 0, almacenamiento other conservado, snapshot old;
- lote individual: resultado true, contador 0, almacenamiento first y snapshot first.

3/3 resultados esperados.

## Carrera compare/setItem
La comparación y escritura de localStorage no son atómicas; otra pestaña puede escribir entre ambas operaciones. No se puede garantizar exclusión mutua solo con localStorage, y una escritura remota previa no se revierte. El mecanismo local es detección de mejor esfuerzo, no control transaccional. Pendiente una prueba adversarial con escritura intercalada entre getItem y setItem, y estudiar CAS/versión del lado servidor sin acceso a servicios reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
