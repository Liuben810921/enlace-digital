# Auditoría: frontera de distancia mínima de mensajería — 13 noviembre 2026

## Estado inicial
HEAD de la rama aislada `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `b5a468772846219045dae4c8514c0a00178dd72d`; no se detectaron cambios concurrentes.

## Riesgo prioritario
El cálculo `CEIL(GREATEST(distance_km,min_km)*rate_cup_per_km)` debe aplicar la distancia mínima a rutas por debajo y exactamente en el umbral, pero calcular sobre la distancia real inmediatamente por encima. Además debe respetar `min_fee_cup`.

## Prueba reproducible
En PostgreSQL 16 desechable, con valores vigentes del fixture sintético, se actualiza la ruta de `cart-a` mediante `mutate_context` a `min_km - 0.01`, `min_km` y `min_km + 0.01`. Se comprueban cotizaciones con claves distintas, el redondeo al CUP superior y la tarifa mínima. Se restaura la distancia original en `finally`. Commit de prueba: `7795fb7d87ce34cf138f2e64dee249cc9b1a8ae2`.

## Criterio de cierre
Si GitHub Actions aprueba, cerrar sin cambios SQL; si falla, inspeccionar el fallo y corregir únicamente defectos demostrados.

**Estado: auditoría cerrada, CI aprobada y sin modificaciones SQL.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Evidencia de cierre

[GitHub Actions #43531876850](https://github.com/Liuben810921/enlace-digital/actions/runs/43531876850) terminó `completed/success` para el commit de pruebas `7795fb7d87ce34cf138f2e64dee249cc9b1a8ae2`. Trabajo `test` (ID `132251317593`) `completed/success`. Se verificaron los límites `min_km - 0.01`, `min_km` y `min_km + 0.01` con restauración del fixture. No se reprodujeron fallos SQL, no se modificó SQL, no hubo merge ni despliegue. La rama no tenía cambios concurrentes antes del cierre.
