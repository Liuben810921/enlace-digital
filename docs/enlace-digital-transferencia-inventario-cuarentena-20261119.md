# Inventario y recuperación en transferencias — 2026-11-19

Base a6aff93541a360b4ac9a53b0bf3a6e82e20a2640. Rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Defectos reproducidos
edDeliverySupplierTransferWarehouses permitía persistir con (1) producto desconocido asociado a [], (2) producto desconocido asociado a un almacén ajeno, (3) producto conocido asociado a un almacén cuyo tipo difiere de origen_producto. Tres reproducciones previas, una escritura cada una.

## Corrección
Con inventario cargado, valida cada clave de asociación contra state.products y cada almacén asociado contra origen_producto. Bloquea la transferencia si hay productos desconocidos o tipos incompatibles, aunque los almacenes afectados estén libres de asociaciones. La asociación [] de un producto conocido es válida.

## Pruebas posteriores con funciones reales y almacenamiento ficticio
Transferencia + helper real: desconocido con [] (bloquea sin escribir), desconocido con almacén ajeno (bloquea), tipo incompatible (bloquea), producto conocido compatible (una escritura), inventario sin cargar (bloquea), invalidación fallida (rollback), rollback fallido (cuarentena): 7/7 resultados esperados.

Recuperación real edDeliveryRecoverQuarantine: producto desconocido [] (cuarentena permanece), conocido [] (recupera), tipo incompatible (bloquea), inventario sin cargar (bloquea), invalidación fallida (bloquea), removeItem fallido (bloquea), datos válidos (recupera): 7/7 resultados esperados.

Total 14 pruebas de regresión focalizadas posteriores a corrección. No navegador real, ni escritura real en localStorage, ni garantía transaccional multi-clave.

## Pendientes
Validar productos de inventario con ID duplicado, estado incompleto de state.products y coherencia de las asociaciones en el instante de persistencia frente a cambios de inventario no persistidos. Pruebas Chromium móvil y batería integral requieren autorización específica. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
