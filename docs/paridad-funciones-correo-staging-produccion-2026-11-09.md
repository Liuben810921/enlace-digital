# Auditoría de paridad SQL — staging y producción (2026-11-09)

## Alcance y método
Comparación **solo lectura** mediante `pg_get_functiondef`, `md5`, `pg_get_function_identity_arguments`, `prosecdef`, `proconfig` y `has_function_privilege` sobre cinco funciones de correo y seguridad.

Producción: `ubrvuplslconfxwpfzxj`. Staging: `xqahthghvozeigbojhyi`.

| Función | MD5 de definición en ambos proyectos |
|---|---|
| `enlace_auth.ed_consumir_token_correo_privado` | `e01fb8898142ac39d9d7366f964f8119` |
| `enlace_auth.ed_emitir_token_correo_privado` | `3a4c70e319bab9f2f75acdc2d5bd12a0` |
| `public.ed_cliente_limite_privado` | `ae37c45cac2aff5a43b3b4d6c4ef49c8` |
| `public.ed_correo_consumir_token_servicio` | `8eae5109f553be701653d9ca8863765e` |
| `public.ed_correo_emitir_token_servicio` | `cd8b9a76e175748ffe36c9a82f8cff1c` |

Las cinco huellas son iguales en ambos proyectos; coinciden también firma, `SECURITY DEFINER`, `search_path` y permisos efectivos. Para las cinco funciones: `anon=false`, `authenticated=false`, `service_role=true`. No se justifica una migración de permisos en producción.

## Estado staging verificado
`0 clientes`, `0 tokens`, `0 sesiones`; `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`.

## Pruebas reproducibles pendientes
1. Ejecutar el plan `docs/plan-prueba-integral-staging-2026-11-09.md` mediante un ejecutor autorizado de SQL transaccional, aislado y con reversión; no intentar evadir bloqueos de ejecución.
2. Registrar aserciones de emisión, consumo único, caducidad, cooldown, recuperación, revocación y limitación atómica.
3. Confirmar que la base queda sin datos ficticios y con interruptores desactivados.
4. La paridad de código NO demuestra el comportamiento dinámico de estas operaciones. No marcar estas pruebas como superadas.
5. Revisar el límite de intentos contra abuso distribuido antes de activar cualquier flujo.

No se aplicaron migraciones ni cambios en producción durante esta auditoría.
