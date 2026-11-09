# Resultado funcional observado — staging — 2026-11-09

Proyecto: `xqahthghvozeigbojhyi` (enlace-digital-staging).
Ejecución manual en Supabase SQL Editor del script `sql/pruebas/staging_correo_integral_rollback_resultados_unificados.sql`, commit `52c1b19`.

## Evidencia visual recibida
- SQL Editor mostró **18 rows**.
- Pruebas 01–05: PASS visibles.
- Prueba 06: **no legible en las capturas disponibles**; no asignar PASS ni FAIL sin evidencia.
- Pruebas 07–10: no legibles en las capturas disponibles; no asignar PASS ni FAIL sin evidencia.
- Prueba 11 `cooldown_after_consumption`: **FAIL** visible, defecto funcional confirmado.
- Pruebas 12–18: **PASS** visibles.
- Verificación posterior independiente, solo lectura: conteos de `clientes_oficiales`, `cliente_credenciales`, `cliente_correo_tokens`, `cliente_sesiones`, `solicitudes_limite` todos 0; tres flags de correo false.

## Estado
- PASS visualmente verificados: **12** (01–05 y 12–18).
- FAIL visualmente verificados: **1** (11).
- Sin evidencia individual suficiente: **5** (06–10).
- No atribuir un total 17/18 sin ver la tabla completa o los totales `total_pass`/`total_fail`.
- El script contenía `BEGIN` y `ROLLBACK`; el estado posterior coincide con la reversión esperada.

## Corrección propuesta, NO aplicada
`sql/propuestas/staging_cooldown_consumido.sql`: elimina el filtro `consumido_en IS NULL` exclusivamente de la comprobación de cooldown, manteniendo la invalidación de tokens pendientes. Se requiere revisión y autorización separada antes de desplegar en staging. No modificar producción ni fusionar PR.

## Próximo paso
Recuperar del resultado ya ejecutado las columnas `total_pass` y `total_fail` o la evidencia de filas 06–10, sin volver a ejecutar el script. Posteriormente solicitar autorización explícita para instalar la corrección **solo en staging**, con verificación previa y plan de reversión.
