# Cambio de tipo, inventario incompleto y fallos de recuperación — 2026-11-19

Rama: plan/havana-osrm-benchmark-offline-20261114. Base e332c7a113bc0ccfde51eaa108bcaf7c01494fd5; al iniciar esta etapa desde 5de04df99d1ea0076de45e109cb955c2eb47f34f la comparación fue identical.

## Defecto reproducido y corregido
edDeliveryRecoverQuarantine comprobaba la lista vacía de almacenes antes de verificar que el ID de producto existiese en el inventario. Un ID desconocido con [] podía desbloquear la cuarentena. Se cambió el orden: comprobar existencia de producto primero; aceptar [] solo para productos conocidos.

## Pruebas sintéticas focalizadas
Funciones reales extraídas de index.html y ejecutadas con dobles JavaScript de DOM, localStorage, inventario e invalidación. No navegador real.

| Área | Escenario | Resultado |
|---|---|---|
| Cambio tipo propio→proveedor | Sin asociaciones | PASS, una llamada de persistencia |
| Cambio tipo | Producto asociado | PASS, bloquea |
| Cambio tipo | JSON de asociaciones corrupto | PASS, bloquea |
| Cambio tipo | Asociaciones cambian durante la operación | PASS, bloquea |
| Cambio tipo | Formulario obsoleto | PASS, bloquea |
| Recuperación | Producto conocido con [] | PASS, desbloquea |
| Recuperación | Producto desconocido con [] | PASS, bloquea; defecto corregido |
| Recuperación | Inventario no cargado | PASS, bloquea |
| Recuperación | removeItem lanza excepción | PASS, conserva cuarentena |
| Recuperación | removeItem no elimina el indicador | PASS, conserva cuarentena |
| Recuperación | Producto conocido asociado correctamente | PASS, desbloquea |

11/11 escenarios con resultado esperado tras corrección. En las pruebas de formulario, una llamada de persistencia simulada no demuestra escritura real.

## Edición de destinos
Se conserva la protección de instantáneas del formulario previamente probada. No se ejecutaron nuevas pruebas de destinos en esta etapa; queda pendiente verificar conflictos de guardado y fallos de almacenamiento con arnés específico.

## Límites y pendientes
No hay atomicidad entre pestañas. No se verificó Chromium móvil, almacenamiento real ni batería integral. Mantener PENDIENTE cualquier ruta no verificada.

Restricciones respetadas: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
