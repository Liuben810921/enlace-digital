# Auditoría: límite superior de tarifa y cotización — 13 noviembre 2026

## Alcance y concurrencia
El HEAD inicial de `audit/delivery-map-readonly-20261113` coincidía exactamente con `c37bcdc026244332e85d0e494f00ad663c236451`, sin cambios concurrentes.

## Riesgo
El límite máximo admitido de `rate_cup_per_km` debe ser estricto: rechazar `100000.01` sin incrementar la versión ni crear auditoría, admitir `100000.00` y cotizar correctamente con ese valor.

## Prueba reproducible
La prueba del laboratorio PostgreSQL desechable registra versión, tarifa y número de auditorías; exige rechazo `22023` del valor superior al máximo sin efectos secundarios; aplica la tarifa exacta `100000` mediante la RPC administrativa, comprueba el importe de `cart-a` con el máximo entre coste por distancia y mínimo configurado y restaura la tarifa original mediante la misma RPC en `finally`. Commit de pruebas: `0f8d4019ad1575ee70493802cd2aface90cc3965`.

## Criterio de cierre
Cerrar solo tras CI satisfactorio, sin SQL si no se demuestra defecto. En caso de fallo, revisar logs y corregir exclusivamente lo demostrado.

**Estado: pendiente de GitHub Actions.** No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
