# Auditoría: redondeo de CUP y prevalencia de tarifa mínima — 13 noviembre 2026

## HEAD inicial
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con `414ffc3a0638784440417aa14699bd033fff9a99`. No se detectaron cambios concurrentes.

## Riesgo prioritario
El cotizador usa `CEIL(GREATEST(distance_km,min_km)*rate_cup_per_km)::bigint` y después `GREATEST(gross,min_fee_cup)`. Debe redondear hacia arriba una fracción positiva de CUP y dar prioridad a la tarifa mínima cuando sea mayor que el resultado calculado, sin aplicar un mínimo indebidamente a un escenario donde está configurado en cero.

## Prueba reproducible
En PostgreSQL 16 desechable, se crea una ruta sintética de 0.01 km, se fijan temporalmente `min_km=0` y `min_fee_cup=0`, y se comprueba que el cobro coincide con el techo de `0.01 * tarifa`. Después se configura una tarifa mínima superior al resultado calculado y se comprueba que prevalece. Se restauran los parámetros y la ruta en el bloque `finally`. No se accede a ninguna base real. Commit de pruebas `30ebff6a7f13099f15009a87d775dbe73400275a`.

## Criterio de cierre
Si CI pasa, cerrar sin modificar SQL: no se ha demostrado defecto. Si falla, inspeccionar logs y corregir únicamente el fallo reproducido antes de repetir las pruebas.

**Estado: pendiente de GitHub Actions.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
