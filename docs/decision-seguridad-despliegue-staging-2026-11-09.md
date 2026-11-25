# Decisión de seguridad y preparación final del despliegue staging — 2026-11-09

## Verificado
- CI del commit `cb9518fffda2c9e71b89043d9498df8d38cf1147`: GitHub Actions `42714426070`, success.
- Captura aportada por el propietario: Supabase organización Enlace Digital, cuenta con rol **Owner**. Esta evidencia acredita el rol de organización, **no una ejecución real de eliminación de Edge Functions**.
- Captura GitHub Pages: rama main, carpeta / (root), dominio personalizado vacío, HTTPS enforced, dominio predeterminado liuben810921.github.io. **Origin de navegador confirmado para CORS: `https://liuben810921.github.io`**, sin ruta.
- Staging `xqahthghvozeigbojhyi`: `list_edge_functions` devuelve lista vacía; no hay función que eliminar para probar permisos. La integración de herramientas actual no expone delete_edge_function. No se ejecutó despliegue ni eliminación.

## Contrato de seguridad propuesto, no aplicado
- Endpoint único staging: `https://xqahthghvozeigbojhyi.supabase.co/functions/v1/enlace-cliente-auth-staging`; no reutilizar URL de producción ni cambiar `index.html` de main.
- CORS: `ED_STAGING_ALLOWED_ORIGIN=https://liuben810921.github.io`, solo POST/OPTIONS y encabezados explícitos `content-type,apikey,authorization`; no comodín, sin credenciales de cookies. CORS no reemplaza autenticación ni rate limiting.
- El navegador utiliza `apikey: sb_publishable_...` de staging, jamás service_role ni secret; no convertir publishable key en Bearer JWT. Los tokens de sesión propios viajan en el cuerpo del POST y son verificados mediante RPC. `verify_jwt` del gateway no puede asumir que el token propio es JWT de Supabase. Antes del despliegue, revisar opción segura de gateway sin JWT heredado y añadir validación explícita de clave pública, controles de abuso y denegación de solicitudes no autorizadas; actualmente el adapter offline solo envía apikey, no la valida en el servidor.
- Despliegue inicial, **solo después de nueva autorización y reversión acreditada**: gate `ED_STAGING_CUSTOMER_AUTH_ENABLED` ausente/false, endpoint devuelve 503, no envía correo ni acepta pedidos; no habilitar tráfico hasta validar JWT/CORS y pruebas HTTP ficticias.

## Reversión
- Owner de la organización es compatible con la gestión administrativa, pero **el permiso efectivo de borrar funciones no se ha probado**. Antes de desplegar, obtener confirmación documental de Supabase de que el rol Owner tiene autorización de eliminación y de que el operador dispone de acceso al panel de staging. Idealmente documentar una vía de borrado autorizada (dashboard o CLI) y verificación posterior con listado vacío. No desplegar una función solo para probar borrado.
- Si no se acredita la capacidad de eliminación, bloquear despliegue; continuar offline. En caso de incidente posterior al despliegue, gate desactivado como defensa adicional y eliminación por operador autorizado.

## Pendientes precisos
1. Confirmación autorizada de capacidad efectiva de eliminación (documentación oficial/soporte Supabase o acceso de operador que permita borrado; la captura de Owner por sí sola no prueba el resultado de la acción).
2. Revisión de gateway verify_jwt, validación de apikey en backend, limitación de tráfico, configuración segura y plan de reversión antes de autorizar despliegue.
3. Autorización separada de despliegue inicialmente desactivado; no concedida en esta fase.

**No se modificó Supabase, producción, secretos, roles, configuración, correo ni pedidos reales.**
