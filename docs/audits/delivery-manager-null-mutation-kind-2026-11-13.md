# Rechazo de tipo de mutación NULL — 13 noviembre 2026

## Riesgo y reproducción
En la RPC sintética `ed_rpc_lab.mutate_context`, `p_kind NOT IN (...)` devuelve `NULL` si el parámetro es SQL NULL. En PL/pgSQL, `IF NULL THEN` no entra en la rama de rechazo; la ejecución avanzaba hacia el bloque alternativo de actualización de ruta. Con una ruta y versión válidas, la llamada podía cambiar la distancia y la versión pese a no haber declarado una operación autorizada.

## Corrección
Se añade `p_kind IS NULL OR` a la validación inicial de la RPC; el error de entrada es `invalid_mutation` / SQLSTATE `22023`. No se modifican roles, permisos, RLS, locks ni funciones fuera del laboratorio.

## Prueba reproducible
La prueba `tests/postgres-delivery-rpc-rls-lab.py` registra la versión, distancia y vencimiento de la ruta y el número de eventos de `context_audit`; llama a `mutate_context(NULL, 'cart-a', version, 5)` como administrador; exige `psycopg.errors.InvalidParameterValue`; comprueba que la ruta y el recuento de auditoría no cambian.

## Evidencia GitHub
- SQL: [f28951513ae06e01c5d47448c719eb584953bcc1](https://github.com/Liuben810921/enlace-digital/commit/f28951513ae06e01c5d47448c719eb584953bcc1)
- Regresión: [c2e88b10d9b79dc2c96fbd98fabe8db04d14d2e9](https://github.com/Liuben810921/enlace-digital/commit/c2e88b10d9b79dc2c96fbd98fabe8db04d14d2e9)
- CI SQL: [#43511365574](https://github.com/Liuben810921/enlace-digital/actions/runs/43511365574) — en ejecución en la primera consulta
- CI regresión: [#43511384704](https://github.com/Liuben810921/enlace-digital/actions/runs/43511384704) — en cola en la primera consulta

**Cierre condicionado a CI:** no afirmar aprobación hasta observar `completed/success` para el run de regresión. El informe es solo documentación y no altera código operativo.

## Límites
Se ha trabajado exclusivamente en la rama aislada y PostgreSQL desechable de GitHub Actions; sin acceso ni modificación de Supabase, staging, producción, clientes reales ni pedidos.
