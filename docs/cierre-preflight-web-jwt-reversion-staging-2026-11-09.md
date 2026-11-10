# Preflight final de integración web/JWT y reversión — ENLACE DIGITAL PR #2

Fecha 2026-11-09. Revisión de solo lectura; no despliegues ni modificaciones de Supabase o producción.

## CI
- Commit base `c0f2cb704352af7a137ffbbee4f0231871027025`: GitHub Actions run `42713341416`, **success**.

## Evidencia de la web (rama main)
- `index.html` es una aplicación monolítica con JavaScript inline (304247 caracteres inspeccionados).
- `ED_URL` y `ED_CUSTOMER_AUTH_URL` apuntan al proyecto **producción** `ubrvuplslconfxwpfzxj`; `ED_CUSTOMER_AUTH_URL` termina en `/functions/v1/enlace-cliente-auth`. El correo `ED_EMAIL_FLOW_URL` también apunta a producción. **No cambiar estos valores durante la fase de solo lectura ni sustituirlos globalmente**: la web comparte configuración de catálogo/admin.
- `edCustomerRequest(action,data)` usa `fetch` con POST y `Content-Type: application/json`, sin `apikey` ni `Authorization`. Requiere diseño compatible con el gateway de staging; no insertar secretos privilegiados en frontend.
- El código del frontend utiliza una clave de formato `sb_publishable_` para otras operaciones; no se detectó `service_role` en el HTML inspeccionado. **No copiar la clave pública de producción como solución automática de staging**.
- `edStoreCustomerSession` guarda token propio en localStorage, `edRestoreCustomerSession` consulta profile, y logout revoca vía backend. Riesgo residual XSS/localStorage requiere revisión antes de tráfico real.
- No se verificó URL de GitHub Pages en metadatos de repositorio. El origen *candidato* bajo Pages estándar sería `https://liuben810921.github.io`, **no confirmado**: origen CORS es esquema + host + puerto, sin ruta `/enlace-digital/`. El intento de acceso público a `https://liuben810921.github.io/enlace-digital/` no devolvió una página verificable en esta revisión. Si existe dominio personalizado, cambia el origen. Se requiere confirmación por Pages Settings o cabecera Origin observada.

## Diseño propuesto, no aplicado
1. Crear una configuración de cliente **separada** para staging y una capa de llamadas específica para autenticación de clientes, sin modificar `ED_URL` global de catálogo/admin y sin tocar producción. Mantener recuperación de correo inactiva.
2. Gateway JWT: los tokens de sesión propios del backend no son JWT de Supabase. Confirmar la estrategia de `verify_jwt` y `apikey` con documentación actual; evitar asumir que una clave `sb_publishable_` es JWT. Si se opta por endpoint público sin verificación JWT, exigir controles independientes y revisión explícita del riesgo, rate limits y origen. CORS no es control de autorización.
3. Permitir solo origen HTTPS de la web de pruebas comprobado, POST/OPTIONS y cabeceras necesarias; preflight y errores no deben revelar claves.
4. Despliegue eventual con `ED_STAGING_CUSTOMER_AUTH_ENABLED` ausente o false (respuesta 503), y validación de proyecto staging. No activar hasta superar pruebas de gateway y revisión del acceso.

## Reversión y permisos
- La integración Supabase conectada ofrece consulta/listado y despliegue de Edge Functions, pero **no ofrece una acción de eliminación de Edge Functions**. El listado staging estaba vacío. No se puede certificar permiso de eliminación mediante esta conexión y no se intentó un despliegue de prueba.
- Para verificar sin escribir: abrir el panel Supabase staging **Edge Functions**, comprobar la cuenta/rol administrativo y la disponibilidad de la acción Delete; si la interfaz solo permite ver la acción pero no confirma el permiso efectivo, pedir comprobación al propietario o soporte Supabase. Alternativamente, usar una vía autorizada con permiso de lectura de roles/capacidades que confirme delete. Documentar responsable de eliminación y prueba de reversión antes del primer despliegue.
- Plan de reversión: desactivar el servicio mediante el gate (si ya existe una configuración segura y autorizada), eliminar exclusivamente la función de staging por el operador con permiso comprobado, verificar lista vacía y HTTP no disponible. **No borrar funciones existentes ni secretos como parte de esta revisión**.

## Puertas de autorización
- **Ahora:** solo confirmar origen HTTPS real y permisos efectivos de eliminación mediante una vía administrativa autorizada; sin desplegar.
- **Después:** autorización explícita para despliegue inicial desactivado, con gateway JWT/CORS ya decidido y capacidad de reversión acreditada.
- **Posteriormente:** autorización específica para activar pruebas HTTP ficticias, sin correos ni pedidos reales.

Conclusión: CI y revisión de código completos; origen real y capacidad de eliminación siguen **sin acreditar**, por lo que el despliegue permanece bloqueado. No se realizaron escrituras SQL ni cambios de secretos, roles, configuración, datos, productos, departamentos, administradores o producción.
