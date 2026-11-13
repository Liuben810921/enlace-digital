# Auditoría: versiones esperadas no positivas al modificar tarifa — 13 noviembre 2026

## HEAD inicial
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con `ed9173ab8ba796b78a2f7c9b0a37d2f1fbe819c6`; no se detectaron cambios concurrentes.

## Riesgo
`ed_rpc_lab.update_rate(p_expected,...)` comprueba `p_expected IS NULL`, pero no `p_expected<1`. Las versiones persistidas son positivas. Una versión cero o negativa pasa la validación y devuelve `version_conflict` (`40001`), que podría inducir reintentos, en vez de `invalid_change` (`22023`). La inconsistencia se observa en el código; requiere evidencia CI antes de corregir SQL.

## Regresión
Se añadieron tres casos (`0`, `-1`, `-9223372036854775808`) que exigen `InvalidParameterValue` y comprueban que ni la tarifa ni su auditoría cambian. Commit `45a297fb4c86c94c836f101611d7d23ebf6202c2` en `tests/postgres-delivery-rpc-rls-lab.py`.

## Plan de verificación
Ejecutar GitHub Actions con la regresión, comprobar los logs, aplicar solo la corrección SQL demostrada si falla y repetir CI hasta confirmar. No modificar servicios externos.

**Estado: fallo reproducido; corrección SQL mínima aplicada, pendiente de CI posterior.** Trabajo exclusivo en GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Evidencia del fallo y corrección

[GitHub Actions #43526688720](https://github.com/Liuben810921/enlace-digital/actions/runs/43526688720) finalizó `completed/failure` sobre `45a297fb4c86c94c836f101611d7d23ebf6202c2`. El trabajo `test` (ID `132234080074`) registró en la línea 69 de la prueba Python `psycopg.errors.SerializationFailure: version_conflict` (SQLSTATE `40001`) al esperar `InvalidParameterValue` (SQLSTATE `22023`).

Se modificó exclusivamente la validación inicial de `ed_rpc_lab.update_rate` para rechazar `p_expected<1` con `invalid_change` (`22023`). Commit de corrección SQL: `8b57a613e7f419b4094e0135c025066f1e1e36e8`. Sin cambios en RLS, privilegios, concurrencia, cálculo de tarifa o registros de auditoría.

**Pendiente:** GitHub Actions `completed/success` sobre el commit SQL para cierre definitivo.
