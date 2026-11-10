# ST-00 — inspección inicial de solo lectura de Supabase staging

Fecha: 2026-11-10. Autorización expresa: metadatos de staging exclusivamente; no leer filas de clientes/históricos ni modificar configuración.

## Identidad y separación de entornos
- Proyecto inspeccionado: `enlace-digital-staging`, referencia `xqahthghvozeigbojhyi`, región `us-east-1`, estado `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- Existe otro proyecto distinto `enlace-digital-db` (ref `ubrvuplslconfxwpfzxj`), **no inspeccionado**.
- Las consultas se dirigieron únicamente a la referencia staging. No se usaron claves secretas ni se revelaron valores.

## Metadatos constatados
- Siete migraciones registradas: harness privado de correo, restricciones y revocación de funciones, esquema staging v4 y cinco RPC de cliente; no se ejecutaron migraciones.
- Ocho tablas de aplicación: cinco en `enlace_auth` (`cliente_correo_tokens`, `cliente_credenciales`, `cliente_sesiones`, `configuracion_correo`, `solicitudes_limite`) y tres en `public` (`clientes_destinatarios`, `clientes_direcciones_entrega`, `clientes_oficiales`).
- Las ocho tienen `relrowsecurity=true`, `relforcerowsecurity=false`, **cero políticas**; `pg_policies` sin filas para esos esquemas. El aviso `rls_enabled_no_policy` del asesor de seguridad (8 findings, INFO) coincide con catálogo. Esto puede ser una política deliberada de denegación para roles cliente; **no se puede certificar la seguridad real de los accesos sin ensayos autorizados**. Documentación: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- No aparecen grants directos a `anon` o `authenticated` sobre las tablas de aplicación en `information_schema.role_table_grants`.
- Diez funciones: dos en `enlace_auth` y ocho en `public`. Ocho son `SECURITY DEFINER`, dos `SECURITY INVOKER`; todas fijan `search_path` vacío. Ninguna permite EXECUTE a `anon` o `authenticated`, según `has_function_privilege`. Los ACL de funciones privadas permiten ejecución por `postgres` y generalmente `service_role`, con excepción de `ed_cliente_registrar_privado`, cuyo ACL incluye solo `postgres`.
- Las funciones `SECURITY DEFINER` tienen propietario `postgres`. Su lógica interna y su invocación desde un controlador de servicio **no están certificadas** por esta inspección. La discrepancia del ACL de `ed_cliente_registrar_privado` es un posible bloqueante de integración si el controlador pretende usar `service_role`; verificar por diseño y pruebas antes de cualquier cambio.
- No hay Edge Functions desplegadas (`list_edge_functions` devolvió lista vacía).
- El esquema estándar `auth` y el esquema privado `enlace_auth` existen.

## Pendiente/no comprobable sin ampliar autorización
- Valores de banderas `ED_STAGING_CUSTOMER_AUTH_ENABLED`, `ED_STAGING_ALLOWED_ORIGIN` y configuración de correo: no se han leído valores de secretos ni filas de configuración; **estado NO VERIFICADO**.
- Configuración del proveedor Auth (JWT, sesiones, correo) a nivel API administrativa: no se ha obtenido una lectura de configuración suficiente. **NO VERIFICADO**.
- Schemas expuestos en Data API, conectividad del controlador y aplicación efectiva de ACL, RLS y JWT: **NO VERIFICADOS**.
- Contenido de funciones SQL y comportamiento de transacciones, registro, recuperación, destinatarios y pedidos: **NO EJECUTADOS**.
- No se consultó ninguna fila de datos de cliente, destinatarios, sesiones, credenciales, correo o pedidos.

## Matriz de decisión
| Dominio | Resultado | Siguiente paso autorizado por separado |
|---|---|---|
| Identidad de staging | PASS | Mantener referencia fija en cualquier prueba |
| Esquema y migraciones | PASS metadatos | Validar compatibilidad con interfaz y controlador |
| ACL de tablas | PASS en catálogo (sin grants cliente) | Ensayos negativos con roles ficticios |
| RLS | PASS configuración de denegación por defecto; eficacia no ensayada | Ensayos de aislamiento autorizados |
| Funciones | PASS inventario; riesgo de privilegios `SECURITY DEFINER` y ACL de registro | Auditoría de definición y prueba de invocación autorizada |
| Edge Functions | Lista vacía | No desplegar sin permiso |
| Flags y Auth | BLOCKED / sin evidencia suficiente | Lectura administrativa específica sin secretos, si existe vía autorizada |
| ST-01–ST-12 funcionales | NOT RUN | Autorización separada de escrituras ficticias y aislamiento |

## Recomendaciones de cierre
1. No modificar `service_role`, grants, políticas, funciones ni banderas sobre la base de una inspección de metadatos.
2. Antes de pruebas de escritura, confirmar mecanismo de invocación de funciones privadas, ACL excepcional del registro, banderas de correo/pedidos y estrategia de reversión.
3. Mantener PR #3 en borrador, pedidos reales y correos sin activar. Requerir autorización independiente para cualquier prueba sintética con escrituras, configuración o lectura de datos históricos.

**Acciones realizadas:** únicamente listado administrativo y consultas `SELECT` a catálogos PostgreSQL y vistas de metadatos, además de asesor de seguridad; sin mutaciones.
