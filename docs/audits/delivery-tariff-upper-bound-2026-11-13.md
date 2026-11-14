# Auditoría: límite superior de tarifa y cotización — 13 noviembre 2026

## Alcance y concurrencia
El HEAD inicial de `audit/delivery-map-readonly-20261113` coincidía exactamente con `c37bcdc026244332e85d0e494f00ad663c236451`, sin cambios concurrentes.

## Riesgo
El límite máximo admitido de `rate_cup_per_km` debe ser estricto: rechazar `100000.01` sin incrementar la versión ni crear auditoría, admitir `100000.00` y cotizar correctamente con ese valor.

## Prueba reproducible
La prueba del laboratorio PostgreSQL desechable registra versión, tarifa y número de auditorías; exige rechazo `22023` del valor superior al máximo sin efectos secundarios; aplica la tarifa exacta `100000` mediante la RPC administrativa, comprueba el importe de `cart-a` con el máximo entre coste por distancia y mínimo configurado y restaura la tarifa original mediante la misma RPC en `finally`. Commit de pruebas: `0f8d4019ad1575ee70493802cd2aface90cc3965`.

## Criterio de cierre
Cerrar solo tras CI satisfactorio, sin SQL si no se demuestra defecto. En caso de fallo, revisar logs y corregir exclusivamente lo demostrado.

**Estado: auditoría cerrada; CI aprobada y sin modificaciones SQL.** No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.

## Evidencia de cierre

[GitHub Actions #43533663334](https://github.com/Liuben810921/enlace-digital/actions/runs/43533663334) terminó `completed/success` para el commit de pruebas `0f8d4019ad1575ee70493802cd2aface90cc3965`. El trabajo `test` (ID `132257280397`) terminó `completed/success`. Se verificó el rechazo de `100000.01` sin efectos sobre versión ni auditoría, la aceptación de `100000`, la cotización con esa tarifa y la restauración mediante RPC. No se reprodujo defecto SQL; no se modificó SQL. Cierre exclusivamente documental, sin merge ni despliegue; no se detectaron cambios concurrentes antes del cierre.
