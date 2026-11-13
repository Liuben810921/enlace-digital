# Auditoría: tarifas positivas subcentavo redondeadas a cero — 13 noviembre 2026

## Verificación inicial
HEAD de `audit/delivery-map-readonly-20261113` idéntico al commit autorizado `c5ba013cf9f689e0f1855690dab40956eb957090`.

## Hallazgo comprobable
`ed_rpc_lab.update_rate` validaba `p_new>0` antes de guardar en `numeric(12,2)`. Un valor positivo como `0.001` o `0.004` supera la validación, pero se redondea a `0.00` al almacenarlo, violando el `CHECK(rate_cup_per_km>0)`. La RPC devuelve un error de restricción de integridad en vez del error de entrada inválida `22023`. La transacción se revierte, pero el contrato de validación es inconsistente.

## Regresión y corrección
- `tests/postgres-delivery-rpc-rls-lab.py`: comprueba rechazo de tarifas `0.001` y `0.004` mediante `InvalidParameterValue` y ausencia de cambios de versión, tarifa y auditoría.
- `tests/postgres-delivery-rpc-rls-lab.sql`: exige `p_new::numeric(12,2)>0` antes de actualizar, preservando las validaciones previas y la semántica de no-op.
- Prueba: `95c060589b6ace43cd0967d0d99eb71e0b904adf`.
- Corrección: `e508ced6204570d1b2a55cfc9f09d9bff676e38f`.

**Estado: auditoría cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Cambios exclusivos de rama aislada y PostgreSQL desechable. Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — CI aprobada

Se verificó [GitHub Actions #43523634461](https://github.com/Liuben810921/enlace-digital/actions/runs/43523634461): workflow `completed/success`, commit probado `e508ced6204570d1b2a55cfc9f09d9bff676e38f`. El trabajo `test` (ID `132223886213`) también finalizó `completed/success`.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. Este cierre modifica exclusivamente la documentación; no cambia SQL ni pruebas, no fusiona ni despliega y no accede ni modifica Supabase, staging, producción, clientes reales ni pedidos.
