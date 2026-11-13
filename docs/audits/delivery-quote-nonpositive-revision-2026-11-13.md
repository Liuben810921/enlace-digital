# Auditoría: revisión no positiva en solicitudes de cotización — 13 noviembre 2026

## HEAD inicial
Se verificó que la rama aislada `audit/delivery-map-readonly-20261113` coincidía con `c0f039a425ef6429143e006a87e9544110a06696`.

## Riesgo identificado en el código
`quote_preview` rechaza una revisión NULL, pero no valida explícitamente `p_revision <= 0`. Una revisión de cesta debe ser positiva: con `0` o valores negativos la función alcanza la comparación de versiones y devuelve `stale_cart` (SQLSTATE `40001`) en vez de `invalid_request` (SQLSTATE `22023`). La clasificación errónea puede provocar reintentos inútiles de solicitudes malformadas. Este defecto es visible por inspección de las condiciones SQL; la regresión debe confirmarlo en PostgreSQL desechable.

## Regresión reproducible
`tests/postgres-delivery-rpc-rls-lab.py` exige `InvalidParameterValue` para revisiones `0`, `-1` y `-9223372036854775808`, y verifica que no se persistan nuevas cotizaciones. Commit `41573e60a38b4bbf656a5c826494eb449d14c147`.

## Procedimiento
1. Ejecutar GitHub Actions con la regresión antes de modificar SQL.
2. Si CI demuestra el fallo esperado, corregir únicamente la validación de `p_revision`.
3. Volver a ejecutar CI y cerrar el informe solo tras `completed/success`.

**Estado: pendiente de evidencia CI.** Solo GitHub y PostgreSQL desechable. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
