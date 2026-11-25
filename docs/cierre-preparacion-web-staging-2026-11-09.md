# Cierre de preparación web staging, sin despliegue — 2026-11-09

## Evidencias
- Commit base `d00814673f92d3267611d3741e8b00adfdb76cff`: GitHub Actions run `42713341416`, success.
- Rama principal `index.html`: URL global de datos/admin y endpoint de cliente apuntan a producción; `edCustomerRequest` envía POST JSON sin apikey. **No modificar ese archivo ni el endpoint productivo para ensayos de staging**.
- No hay CNAME en la rama auditada ni workflows Pages convencionales en rutas comprobadas; esto **no acredita** el dominio real. La URL candidata de Pages `https://liuben810921.github.io/enlace-digital/` no fue accesible mediante consulta web, así que **el origen HTTPS real sigue sin verificar**. Para CORS, Origin no incluye ruta; si Pages estándar, sería `https://liuben810921.github.io`.
- Supabase staging `xqahthghvozeigbojhyi`: listado de Edge Functions vacío. La conexión disponible no expone operación de eliminación ni inspección efectiva de permisos de borrado; **no se puede acreditar autorización de eliminación** con consultas de lectura disponibles.

## Preparación offline realizada
- `scripts/staging_customer_web_adapter.mjs`: transporte opt-in exclusivo al endpoint de staging, requiere clave `sb_publishable_` de staging en runtime, envía la clave en `apikey` y mantiene token propio en cuerpo JSON; rechaza URLs de producción e inseguras. **No está conectado al index.html de producción**.
- `tests/staging_customer_web_adapter_test.mjs`: tests sin red de rechazo de URL de producción, cabeceras y manejo fail-closed de respuestas no JSON.
- Workflow CI ampliado para ejecutar `node --test` al cambiar adapter o tests.
- La clave pública no identifica usuarios ni sustituye la validación de token de sesión del backend; no usar service_role en navegador.

## JWT/CORS
- Según documentación Supabase de octubre de 2026, `verify_jwt` es comprobación de gateway, distinta de la validación propia de token de cliente. Una clave publishable va en `apikey`, no como Bearer. Para llamadas con clave publishable, Supabase recomienda un modo de autenticación `publishable` en el backend cuando se desactiva el chequeo JWT; **este adapter por sí solo no verifica criptográficamente la clave**. Antes de activar, revisar middleware/gateway y protección antiabuso. Referencias: https://supabase.com/docs/guides/functions/auth-headers y https://supabase.com/docs/guides/functions/auth
- CORS debe permitir exclusivamente el origen HTTPS verificado de la web de pruebas, no un origen deducido; CORS no es control de autenticación.

## Verificación administrativa necesaria (sin escritura)
1. **GitHub:** Repository > Settings > Pages. Capturar sección `Your site is live at`, `Custom domain` y `Build and deployment` para acreditar URL real. No cambiar ajustes.
2. **Supabase:** elegir proyecto **enlace-digital-staging**, comprobar referencia `xqahthghvozeigbojhyi`, ir a Edge Functions y revisar si la cuenta propietaria dispone de la opción de eliminar funciones. Como el listado está vacío, puede no haber acción Delete visible; **la presencia de rol propietario o botón no demuestra permiso efectivo**. Para acreditar eliminación sin crear una función, obtener confirmación de permisos por la consola administrativa/soporte Supabase; no crear función de prueba sin nueva autorización.
3. Documentar el operador responsable de reversión. Tras autorización futura, desplegar inicialmente desactivado (gate false), verificar HTTP 503 y rollback por eliminación de la función exclusivamente en staging; no desplegar antes de acreditar capacidad de borrado.

## Estado
Preparación offline completada; despliegue bloqueado exclusivamente por permiso de reversión y decisiones de gateway/JWT/CORS. No se escribió SQL ni se cambiaron secretos, roles, producción, correos, pedidos reales ni configuración de Supabase.
