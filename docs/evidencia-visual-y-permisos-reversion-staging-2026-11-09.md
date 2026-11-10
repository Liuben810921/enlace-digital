# Evidencia visual y permisos de reversión — staging (solo lectura)

Proyecto: `xqahthghvozeigbojhyi` / `enlace-digital-staging`. PR #2. Fecha: 2026-11-09.

## Evidencia visual proporcionada por el responsable del proyecto

1. Captura de Edge Functions: pantalla `Deploy your first Edge Function`, sin funciones existentes. Confirmación adicional por `list_edge_functions` conectado: `[]`.
2. Captura de Edge Function Secrets > Custom secrets: `No custom secrets created`. En consecuencia, `ED_STAGING_CUSTOMER_AUTH_ENABLED` **no está definido como secreto personalizado**; el código solo se habilita con el valor literal `true`. Este hecho no descarta otras fuentes de configuración fuera del listado, por lo que se conserva la comprobación de despliegue inerte.
3. Captura de Default secrets: nombres `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_JWKS`. Los dos últimos legacy figuran como `DEPRECATED`; no se revelaron valores.
4. Captura del menú `Deploy a new function`: `Via Editor`, `Via CLI`, `Via AI Assistant`; el menú no proporciona controles de eliminación de una función.

## Verificación independiente

- Proyecto `ACTIVE_HEALTHY`, PostgreSQL 17.11, región us-east-1.
- Funciones Edge: **0**.
- CI del commit `376b23135d6648b3ae4ca74a4859b82ee4a21674`: run `42704802217`, **success**.

## Reversión: capacidad documentada, permiso no verificado

La CLI documenta `supabase functions delete enlace-cliente-auth-staging --project-ref xqahthghvozeigbojhyi`, pero el comando es destructivo y no debe ejecutarse para probar permisos. La conexión Supabase actualmente disponible **no incluye** operaciones de lectura de permisos de eliminación ni eliminación de funciones. No hay función creada sobre la que inspeccionar controles de borrado del panel.

### Procedimiento reproducible para una autorización posterior

- Antes de desplegar, responsable con acceso al proyecto confirma que tiene rol con permisos de gestión de Edge Functions y CLI autenticada contra el proyecto staging. La consulta de identidad/rol no debe incluir ni compartir tokens de acceso.
- Preparar copia exacta del código y de la configuración no secreta. Si el despliegue inerte fuera autorizado, registrar ID/versión de función y evidencia del estado de desactivación.
- Ante incidente, desactivar primero la función mediante la variable de habilitación si estuviera activada, y luego eliminarla mediante la operación de gestión autorizada. Confirmar con `list_edge_functions` que no queda función.
- Nunca ejecutar eliminación, cambios de secretos ni despliegue sin autorización explícita.

## Bloqueo restante y decisión

**Permiso real de eliminación no demostrado.** El hecho de que un usuario pueda navegar por el panel o que la CLI documente un comando no prueba autorización para eliminar funciones. Mantener pendiente la puerta de reversión; no autorizar aún el despliegue inerte. No se realizaron escrituras ni cambios en staging o producción.
