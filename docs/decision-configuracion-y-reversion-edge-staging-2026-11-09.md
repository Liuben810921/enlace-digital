# Resolución parcial de bloqueos — despliegue Edge inerte (NO AUTORIZADO)

Proyecto exclusivo: `xqahthghvozeigbojhyi`. PR #2. No ejecutar despliegues, secretos ni escrituras.

## 1. Comprobación de secretos: no verificable con permisos de solo lectura disponibles

Las acciones disponibles permiten listar proyectos y funciones, pero **no** consultar de manera segura el estado de variables/secretos Edge (presencia y estado, sin revelar valor). SQL no es una vía apropiada para consultar secretos del runtime Edge. No se ha consultado ni revelado ninguna clave.

**Requisito bloqueante:** una persona con acceso autorizado a la configuración de Edge en staging debe verificar exclusivamente el estado booleano de `ED_STAGING_CUSTOMER_AUTH_ENABLED` (ausente o diferente de `true`), presencia de `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del proyecto staging, y el origen `ED_STAGING_ALLOWED_ORIGIN`. No compartir los valores secretos en el chat ni en GitHub. Si la variable de habilitación es `true`, detenerse: no desplegar.

## 2. Arranque seguro: corregido y probado

La inicialización de `createClient` se desplazó dentro del handler, **después** de la condición de rechazo `!enabled || !validProject || !key`. La prueba local de mocks verifica que, desactivado, el handler devuelve 503 sin crear cliente privilegiado. CI `42704223130` del commit `01b8bec401bf5d46269bbc72879ff9e164e56052`: **success**.

## 3. verify_jwt: decisión para despliegue inerte

**Decisión conservadora: `verify_jwt=true` para cualquier despliegue inicial inerte.** La pasarela de Supabase exige un JWT válido antes de ejecutar el handler; por tanto, una llamada anónima puede devolver 401 en vez de 503. No se debe prometer 503 para tráfico sin JWT. La ruta de registro/login podría necesitar acceso desde el navegador sin JWT de usuario: esa decisión de arquitectura queda **pendiente de pruebas y autorización independientes**, sin desactivar el control de la pasarela por conveniencia. Una futura configuración `verify_jwt=false` expone el endpoint a invocaciones públicas y requerirá medidas antiabuso y aprobación específicas. Referencia: documentación oficial Supabase, Function Configuration.

## 4. Reversión de una función nueva: pendiente de capacidad operativa

El listado de staging no contenía funciones Edge. La acción de despliegue disponible crea/reemplaza funciones y las expone inmediatamente. **No se dispone en este entorno de una acción autorizada para eliminar o despublicar una Edge Function**. Dejarla inerte con la variable desactivada es una mitigación, pero no equivale a retirar el endpoint. Antes de desplegar se necesita comprobar, mediante acceso autorizado al panel/CLI de staging, un procedimiento real de eliminación o despublicación, con permisos y responsable designados. No afirmar que la reversión fue probada.

## 5. Condiciones de salida

- Confirmar el estado seguro de variables/secretos sin revelar valores.
- Confirmar el mecanismo operativo de eliminación/despublicación en staging y su responsable.
- Mantener `verify_jwt=true` en despliegue inerte; definir y autorizar por separado cualquier exposición de registro/login.
- Reconfirmar CI, proyecto, ausencia de funciones y datos, y aprobación específica antes de desplegar.

**Conclusión: NO APTO para autorizar despliegue todavía.** Código de arranque corregido y CI verde; bloqueos externos de configuración y reversión pendientes. No se desplegó ni activó Edge, no hubo escrituras en Supabase, ni correos o pedidos reales.
