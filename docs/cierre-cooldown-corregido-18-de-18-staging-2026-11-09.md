# Cierre definitivo tras corrección de cooldown — staging — 2026-11-09

## Alcance
Proyecto **enlace-digital-staging** (`xqahthghvozeigbojhyi`). No se modificó producción. No se fusionó PR #1.

## Cambio aplicado
Se instaló exclusivamente en staging la función propuesta en `sql/propuestas/staging_cooldown_consumido.sql`, después de recuperar y guardar la definición anterior en `sql/respaldo/staging_ed_emitir_token_correo_privado_pre_correccion_2026-11-09.sql`. Verificación SQL de definición instalada confirmó que el cooldown de diez minutos incluye tokens consumidos, mientras la invalidación solo afecta a tokens pendientes.

## Pruebas funcionales
El operador ejecutó en el SQL Editor de staging el script `sql/pruebas/staging_correo_integral_rollback_resultados_unificados.sql` con `BEGIN` y `ROLLBACK`. Captura aportada tras el cambio muestra **18 rows**, `total_pass=18`, `total_fail=0`. La prueba 11, anteriormente FAIL, queda aprobada dentro de los totales de la nueva ejecución.

## Verificación posterior independiente
Consulta de solo lectura posterior a la ejecución:
- `public.clientes_oficiales`: 0
- `enlace_auth.cliente_credenciales`: 0
- `enlace_auth.cliente_correo_tokens`: 0
- `enlace_auth.cliente_sesiones`: 0
- `enlace_auth.solicitudes_limite`: 0
- `enlace_auth.configuracion_correo`: `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`
- Función corregida: verificada instalada.

## Resultado
**18 PASS / 0 FAIL**, datos de prueba revertidos según verificación posterior, correo desactivado. La corrección está aplicada únicamente a staging. No implica aprobación para producción, activación de correos, pedidos reales ni merge del PR.
