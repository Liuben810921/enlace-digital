# Destinos: conflictos de persistencia y recuperación — 2026-11-19

Base 5b8e8caa4c8f8be00a1ba03f2782e2b60eb46bfb. Rama aislada plan/havana-osrm-benchmark-offline-20261114; comparación inicial identical, cero commits posteriores.

## Defecto y corrección
edDeliveryDestinationSave y edDeliveryDestinationDelete comprobaban una instantánea antes de invocar edDeliveryPersistAndInvalidate, pero el helper volvía a leer el almacenamiento sin contrastarlo con la instantánea original. Una modificación intermedia podía sobrescribirse. El helper admite ahora un cuarto argumento opcional expectedPrevious y rechaza diferencias antes de escribir. Edición y eliminación de destinos lo suministran; creación conserva tres argumentos.

## Pruebas sintéticas ejecutadas
Funciones reales extraídas de index.html, localStorage y dependencias simuladas.

| Caso | Resultado |
|---|---|
| Persistencia de edición normal | PASS, una escritura |
| Cambio detectado en límite de persistencia | PASS, cero escrituras |
| Invalidación fallida | PASS, restauración del estado previo |
| Escritura parcial seguida de excepción | PASS, restauración verificada |
| Escritura y rollback fallan | PASS, cuarentena activada |
| Eliminación normal | PASS, una persistencia |
| Eliminación: cambio durante confirmación | PASS, cero persistencias |
| Eliminación: cambio antes de persistir | PASS, rechazo en helper simulado |
| Eliminación: persistencia falla | PASS, no confirma eliminación |

9 escenarios con resultado esperado. La prueba de conflicto en eliminación simula el contrato del helper; las cinco pruebas iniciales ejecutan el helper real.

## Límites
No hay garantía de atomicidad multi-pestaña entre última lectura y escritura. La recuperación de cuarentena y las asociaciones de almacenes se verificaron en etapas anteriores, no se repitieron aquí. Pendiente: pruebas de edición de destinos con DOM real, carreras entre pestañas, manejo de errores de almacenamiento real y batería integral autorizada.

Restricciones: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
