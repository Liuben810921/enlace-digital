# Integración focalizada de transferencias, reasignación y rollback — 2026-11-19

Base 9e7d392da50cb501748afb2a66df65ce5aeda8d7. Rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Método
Funciones reales extraídas de index.html y ejecutadas conjuntamente con edDeliveryPersistAndInvalidate real, con almacenamiento ficticio, DOM y confirmaciones simuladas. No navegador real ni datos reales.

## Resultados
Tres operaciones (transferencia entre proveedores, reasignación de productos, desvinculación) por cinco escenarios (normal, JSON corrupto, dependencias, invalidación fallida, rollback fallido): 15 ejecuciones. En los casos normales hubo una escritura; JSON corrupto bloqueó sin escribir; transferencia con dependencias bloqueó; reasignación/desvinculación con asociaciones válidas procedieron; invalidación fallida produjo rollback; fallo de rollback activó cuarentena. Los 15 resultados coincidieron con el comportamiento esperado.

Cuatro pruebas adicionales de reasignación: almacén de tipo incompatible (bloquea), destino inactivo (bloquea), asociación con almacén inexistente (bloquea), duplicados en lista de almacenes (defecto reproducido: permitía normalización silenciosa y escritura).

## Corrección
edDeliveryReassignWarehouse y edDeliveryUnlinkWarehouseProducts rechazan ahora listas de IDs duplicados antes de modificar asociaciones. Pruebas posteriores con ambas funciones reales y helper real: duplicados rechazados sin escrituras y asociaciones válidas persistidas (4/4 PASS).

Total: 19 ejecuciones exploratorias y 4 de regresión posteriores al arreglo. No se afirma que todas las 19 sean PASS: una reprodujo el defecto corregido.

## Pendientes
La transferencia entre proveedores no rechaza todavía explícitamente duplicados en listas de asociaciones ajenas al conjunto afectado; requiere revisión focalizada. No hay atomicidad multi-clave ni entre pestañas; pendiente validación Chromium y batería integral previa autorización. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
