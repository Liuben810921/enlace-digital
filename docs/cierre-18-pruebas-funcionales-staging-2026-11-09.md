# Cierre definitivo de 18 pruebas funcionales — staging — 2026-11-09

Proyecto: `xqahthghvozeigbojhyi` — enlace-digital-staging.
Origen: ejecución manual de `sql/pruebas/staging_correo_integral_rollback_resultados_unificados.sql` desde Supabase SQL Editor, por el operador autorizado.

## Resultado observado
La captura final de la tabla `18 rows` muestra `total_pass=17` y `total_fail=1` en las columnas calculadas de resultados. La fila 11 `11_cooldown_after_consumption` muestra `FAIL`; las filas 01–05 y 12–18 muestran `PASS` individualmente en capturas. Las filas 06–10 no fueron capturadas individualmente, pero quedan comprendidas en el total calculado de 17/1 y el único FAIL identificado.

**Resultado global: 17 PASS, 1 FAIL (prueba 11).**

## Reversión comprobada
Consulta SELECT posterior a la ejecución: `public.clientes_oficiales`, `enlace_auth.cliente_credenciales`, `cliente_correo_tokens`, `cliente_sesiones`, `solicitudes_limite` con conteo 0. `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`. El script incluye `BEGIN` y `ROLLBACK`; sin `COMMIT`.

## Defecto confirmado
`enlace_auth.ed_emitir_token_correo_privado` excluye tokens consumidos de su comprobación de cooldown de 10 minutos, permitiendo emisión inmediata tras consumir un token.

## Corrección pendiente
Propuesta revisable: `sql/propuestas/staging_cooldown_consumido.sql`. **NO desplegada**. Antes de aplicarla: autorización específica de cambio en staging, respaldo/definición anterior disponible, comprobación de proyecto correcto, ejecución por canal permitido, y repetición de la batería de 18 pruebas con rollback. No modificar producción ni fusionar PR; mantener correo y pedidos reales desactivados.
