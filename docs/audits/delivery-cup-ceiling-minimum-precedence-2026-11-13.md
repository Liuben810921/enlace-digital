# Auditoría: redondeo de CUP y prevalencia de tarifa mínima — 13 noviembre 2026

## HEAD inicial
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con `414ffc3a0638784440417aa14699bd033fff9a99`. No se detectaron cambios concurrentes.

## Riesgo prioritario
El cotizador usa `CEIL(GREATEST(distance_km,min_km)*rate_cup_per_km)::bigint` y después `GREATEST(gross,min_fee_cup)`. Debe redondear hacia arriba una fracción positiva de CUP y dar prioridad a la tarifa mínima cuando sea mayor que el resultado calculado, sin aplicar un mínimo indebidamente a un escenario donde está configurado en cero.

## Prueba reproducible
En PostgreSQL 16 desechable, se crea una ruta sintética de 0.01 km, se fijan temporalmente `min_km=0` y `min_fee_cup=0`, y se comprueba que el cobro coincide con el techo de `0.01 * tarifa`. Después se configura una tarifa mínima superior al resultado calculado y se comprueba que prevalece. Se restauran los parámetros y la ruta en el bloque `finally`. No se accede a ninguna base real. Commit de pruebas `30ebff6a7f13099f15009a87d775dbe73400275a`.

## Criterio de cierre
Si CI pasa, cerrar sin modificar SQL: no se ha demostrado defecto. Si falla, inspeccionar logs y corregir únicamente el fallo reproducido antes de repetir las pruebas.

**Estado: auditoría cerrada; pruebas aprobadas y sin modificaciones SQL.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — CI satisfactoria

[GitHub Actions #43529095041](https://github.com/Liuben810921/enlace-digital/actions/runs/43529095041) terminó `completed/success` para el commit `30ebff6a7f13099f15009a87d775dbe73400275a`. El trabajo `test` (ID `132242041115`) terminó `completed/success`.

La regresión comprobó el redondeo hacia arriba de CUP fraccionarios y la prevalencia de la tarifa mínima en el prototipo PostgreSQL desechable. No se demostró defecto en SQL y **no se modificó SQL**. El cierre es exclusivamente documental, sin merge ni despliegue. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
