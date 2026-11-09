# Auditoría read-only: RPC v4, grants y RLS — 2026-11-09

Proyecto staging `xqahthghvozeigbojhyi`; base de trabajo commit `47b4411a5398bd18e329aa90e71b6f72a2cea9a4`. Únicamente consultas SELECT a catálogos PostgreSQL y lectura de archivos de GitHub. No se ejecutó ningún RPC, DML, DDL, migración, despliegue o activación.

## RPC reales frente a borrador `sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql`

Las cinco funciones de v4 están instaladas con nombres, argumentos, tipos de retorno, `SECURITY DEFINER`, propietario `postgres` y `search_path=''` esperados. Se inspeccionó `pg_get_functiondef` de las cinco: las secuencias de validación, registro con residencia, hashing de contraseña, control de intentos, creación de sesión con expiración, revocación y actualización de dirección corresponden al texto lógico del borrador v4. Esta revisión manual **no es una comparación byte a byte ni una prueba funcional**. El limitador `ed_cliente_limite_privado` también existe con firma esperada.

Privilegios efectivos según `has_function_privilege`: las cinco RPC de acceso externo y el limitador permiten `service_role`, niegan `anon` y `authenticated`. La auxiliar `ed_cliente_registrar_privado` niega los tres roles consultados. Las seis funciones usan `SECURITY DEFINER`; el propietario `postgres` implica que no puede asumirse aislamiento por RLS dentro de sus cuerpos. El token de sesión y filtros por `cliente_numero` son controles fundamentales; falta prueba dinámica autorizada.

## Tablas, políticas y permisos

Seis tablas revisadas: `public.clientes_oficiales`, `public.clientes_destinatarios`, `public.clientes_direcciones_entrega`, `enlace_auth.cliente_credenciales`, `enlace_auth.cliente_sesiones`, `enlace_auth.solicitudes_limite`. Todas tienen RLS activo; `pg_policies` devolvió cero políticas en estas tablas. `anon` y `authenticated` no tienen permisos efectivos SELECT/INSERT/UPDATE/DELETE en ninguna de las seis. El modelo es denegar acceso directo y operar mediante RPC privilegiados; RLS por sí solo no demuestra la seguridad de esas RPC.

`service_role` tiene SELECT, INSERT, UPDATE y **DELETE** en `clientes_destinatarios` y `clientes_direcciones_entrega`; el borrador de esquema v4 solo concede SELECT, INSERT y UPDATE. **Diferencia de mínimo privilegio pendiente de evaluar**; no revocar sin aprobación y análisis de consumidores. `service_role` tiene USAGE y SELECT en ambas secuencias identity, como prevé v4. No tiene permisos directos sobre `clientes_oficiales` en las cuatro operaciones consultadas; los RPC SECURITY DEFINER actúan como propietario.

Las FK de destinatarios y direcciones a `clientes_oficiales(numero)` existen y están validadas. Los CHECK de teléfono, longitud de dirección y coordenadas existen. La restricción `ed_cliente_cuba_direccion_ck` existe como `NOT VALID` (`convalidated=false`), igual que la propuesta v4: se aplica a filas nuevas/modificadas pero no certifica retrospectivamente las existentes.

## Conclusión y bloqueos

**Compatible a nivel de catálogo y lógica revisada; no listo para activación.** Bloqueos: (1) verificar valores efectivos de secrets sin revelarlos; (2) pruebas funcionales de aislamiento, abuso, registro y revocación requieren autorización separada; (3) justificar/reducir DELETE de `service_role` en tablas de destinatarios y direcciones; (4) verificar impacto del CHECK NOT VALID y cualquier validación futura; (5) confirmar procedimiento de reversión de Edge Function antes de despliegue. No se ha autorizado ninguno de esos cambios.

Documentación oficial: https://supabase.com/docs/guides/database/postgres/row-level-security
