# Auditoría: cotización con distancia cero y tarifa mínima — 13 noviembre 2026

## HEAD inicial
La rama `audit/delivery-map-readonly-20261113` coincidía exactamente con `3ff2cb8cc0ed693b2ebbd2d576e96200553dd9bc`; no se detectaron cambios concurrentes.

## Riesgo prioritario
Una ruta de distancia cero es admitida deliberadamente por `mutate_context` (la tarifa mínima no depende de la distancia física). Se comprueba que `quote_preview` aplique correctamente la distancia mínima configurada y la tarifa mínima, y que la repetición idempotente mantenga el mismo importe. Un fallo podría generar cotizaciones de cero CUP o inferiores al mínimo.

## Regresión reproducible
La prueba configura temporalmente una ruta sintética con `distance_km=0`, obtiene `rate_cup_per_km`, `min_km` y `min_fee_cup`, calcula `max(ceil(min_km*rate), min_fee)`, exige ese valor en la cotización y su replay, y restaura la ruta de prueba. Commit `1c2ae2d640ea0cdf571e1fe61339ffa491eb6924` en `tests/postgres-delivery-rpc-rls-lab.py`.

## Criterio de cierre
Si GitHub Actions pasa, documentar que no se ha demostrado defecto y cerrar sin modificar SQL. Si falla, inspeccionar logs y corregir exclusivamente un fallo demostrado, seguido de nueva ejecución.

**Estado: pendiente de GitHub Actions.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
