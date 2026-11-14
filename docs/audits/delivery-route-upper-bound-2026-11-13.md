# Auditoría: límite superior de distancia de ruta — 13 noviembre 2026

## Control de concurrencia
HEAD inicial de la rama aislada `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `a6c341e8ef04c4782bca271c6c94815c72de6cb9`; sin cambios concurrentes detectados.

## Riesgo
El laboratorio debe rechazar rutas mayores que 10000 km sin cambios de versión ni auditoría, y cotizar correctamente una ruta exactamente igual a 10000 km.

## Regresión reproducible
En PostgreSQL 16 desechable, la prueba verifica rechazo de `10000.01` km mediante la RPC administrativa y ausencia de cambios en ruta y auditoría. Después acepta `10000` km, comprueba el cálculo de CUP y restaura la distancia previa en `finally`. Commit de pruebas `92119bddc63c32c2c98d08080aecacc69b03b8e6`.

## Criterio de cierre
Si CI pasa, cerrar sin cambios SQL; si falla, revisar logs y corregir únicamente el defecto demostrado.

**Estado: pendiente de GitHub Actions.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
