# Staging: relación mínima de clientes oficiales — 2026-11-09

Proyecto de staging: `xqahthghvozeigbojhyi`. Producción consultada solo mediante SELECT; sin migraciones de producción.

## Comparación previa
En producción `enlace_auth.cliente_credenciales.cliente_numero` tiene FK a `public.clientes_oficiales(numero)` con `ON DELETE RESTRICT`. La tabla oficial tiene 15 columnas, entre ellas `numero`, `codigo`, `nombre`, `auth_user_id` y `residencia`. Staging carecía de la tabla padre y la FK.

## Migración aplicada
`add_minimal_official_client_parent_and_fk` completada con `success=true` en staging:
- Tabla mínima `public.clientes_oficiales`: `numero` PK, `codigo` UNIQUE, `nombre`, `auth_user_id` UNIQUE FK a `auth.users`, `residencia` con valores válidos `cuba`/`extranjero`, `creado_en`.
- RLS activada y acceso directo revocado a `PUBLIC`, `anon`, `authenticated` y `service_role`.
- FK `enlace_auth.cliente_credenciales(cliente_numero)` → `public.clientes_oficiales(numero)` `ON DELETE RESTRICT`.
- La consulta posterior confirmó exactamente la FK.

## Alcance y límites
El padre de staging es **mínimo**, no réplica completa de las 15 columnas, triggers o políticas de producción. Adecuado para la integridad referencial del harness de tokens; **no** sirve para certificar todo el registro de clientes.

Estado posterior: 0 clientes, 0 credenciales, 0 tokens, 0 sesiones, `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`.

## Pendiente
La ejecución de pruebas transaccionales de ciclo de vida de tokens sigue pendiente por bloqueos anteriores del entorno de ejecución. No intentar eludir controles; preparar ejecutor autorizado con reversión, datos ficticios y aserciones. No conectar SMTP ni activar pedidos.
