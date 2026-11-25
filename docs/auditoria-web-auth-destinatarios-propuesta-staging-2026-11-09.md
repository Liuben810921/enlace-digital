# Auditoría de integración web y propuesta de aislamiento staging — 2026-11-09

## Evidencia de código (rama main, index.html)
- Líneas ~1040: `ED_CUSTOMER_AUTH_URL='https://ubrvuplslconfxwpfzxj.supabase.co/functions/v1/enlace-cliente-auth'`. **Proyecto de producción**, no staging (`xqahthghvozeigbojhyi`).
- Línea ~1105: `ED_EMAIL_FLOW_URL='https://ubrvuplslconfxwpfzxj.supabase.co/functions/v1/enlace-correo-flujos'`, también producción.
- `edCustomerRequest(action,data)` envía POST JSON a la Edge Function; acciones observadas: `register`, `login`, `profile`, `logout`, `address-save`, `delivery-location-save` y guardado de destinatarios. No es persistencia directa del frontend; depende del backend.
- `submitOfficialCustomerSignup` valida nombre y apellido, teléfono normalizado, residencia, dirección obligatoria si Cuba, correo opcional y contraseña 8–128 caracteres; envía `{name,phone,email,password,residence,address}`.
- `edCustomerSignIn` envía `{phone,password}`, guarda token/expiración en `localStorage` bajo `ed_customer_secure_session_v1`; `edRestoreCustomerSession` consulta `profile`; `edCustomerLogout` borra sesión local y solicita `logout`.
- `edSaveHabitualAddress` envía `address-save`; `edOfficialTemporarySave` envía `delivery-location-save`; formulario de destinatario utiliza flujo oficial por función.
- `edLoadOfficialClients` (líneas ~1435–1450) consulta por REST `clientes_oficiales` con columnas `telefono,correo,estado,direccion_habitual,provincia,municipio,barrio`, además `clientes_destinatarios` y `pedidos_oficiales`. Staging tiene `clientes_oficiales` sin esas columnas y no tiene las dos últimas tablas.
- La cuenta demo (`CLIENT_KEY='enlace_demo_clients_v18'`) guarda objetos de clientes en `localStorage`; `doLogin` compara `c.password===pw`. No utilizar contraseñas reales en demo.
- `ED_REAL_CHECKOUT_ENABLED=false` en el frontend, no sustituye un control de backend.

## Evidencia staging
Solo seis tablas de aplicación en `public` y `enlace_auth`: `clientes_oficiales`, `cliente_credenciales`, `cliente_sesiones`, `cliente_correo_tokens`, `configuracion_correo`, `solicitudes_limite`. No hay Edge Functions desplegadas según inventario anterior. No hay tablas `clientes_destinatarios`, `pedidos_oficiales`, ni direcciones de entrega. PR #1 abierto/draft, sin fusionar.

## Riesgo confirmado
La web actual apunta a **producción** para autenticación y correo. No ejecutar pruebas de registro/login en esa interfaz sin aislar previamente el entorno. La lógica frontend no prueba la existencia ni seguridad del backend de staging. No cambiar URLs en main ni hacer despliegues sin aprobación específica.

## Propuesta — SIN APLICAR
1. Crear entorno de pruebas separado (rama/preview no publicado) que use URL de Edge Function de staging configurada explícitamente; no usar endpoint de producción ni credenciales privilegiadas en navegador.
2. Auditar el código de la Edge Function original y su contrato (acciones, validaciones server-side, permisos, hashing, rate limits, ownership y revocación). No suponer que el frontend garantiza seguridad.
3. Preparar migración versionada staging con columnas de cliente necesarias, direcciones habituales, `clientes_destinatarios`, `direcciones_entrega`, historial inmutable por pedido y controles de propietario/administración. Mantener separación de pedidos demo/reales. Diseño detallado y SQL solo tras revisar contratos de backend y esquema actual; no inventar esquema incompatible.
4. Aplicar RLS deny-by-default, grants mínimos, índices/FKs, validación server-side de dirección Cuba, unicidad de teléfono, sesión con hash y expiración, prohibición de acceso cruzado a destinatarios, y trazabilidad de cambios.
5. Preparar pruebas transaccionales aisladas y end-to-end contra staging sin correos reales ni pedidos; hacer copia/verificación previa y rollback.
6. Verificar que pedidos reales y correo siguen desactivados antes de cualquier prueba.

## Estado
Auditoría de lectura completada; **sin migraciones, cambios de producción, activación de correo/pedidos ni merge**. Bloqueo para pruebas E2E: endpoint de frontend apunta a producción y staging no dispone de backend/modelo completo.
