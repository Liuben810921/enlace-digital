# Auditoría inicial de registro, sesiones y destinatarios — staging — 2026-11-09

## Alcance y método
Consultas SELECT a catálogos PostgreSQL del proyecto `xqahthghvozeigbojhyi` y lectura del estado de PR #1. Sin escrituras en Supabase, sin pruebas de registro con datos reales ni correcciones de esquema.

## Hallazgos verificados
- Existen `public.clientes_oficiales`, `enlace_auth.cliente_credenciales`, `cliente_sesiones`, `cliente_correo_tokens`, `configuracion_correo` y `solicitudes_limite`. **Son las únicas tablas de aplicación visibles en public/enlace_auth**.
- `public.clientes_oficiales` tiene `numero,codigo,nombre,auth_user_id,residencia,creado_en`. `residencia` admite `cuba`, `extranjero` o NULL; no existe columna de dirección habitual.
- No existen tablas de aplicación para direcciones, destinatarios ni pedidos en los esquemas revisados.
- Credenciales: teléfono E.164 único, hash de contraseña, correo opcional, intentos fallidos y bloqueo; FK a cliente. Sesiones: token_hash único, expiración, revocación y FK a credenciales.
- En `public` y `enlace_auth` no hay funciones SQL de registro, inicio/cierre de sesión o CRUD de destinatarios. Las funciones de correo y rate-limit existentes no sustituyen estos flujos.
- PR #1 sigue abierto, draft, no fusionado.

## Interpretación y límites
La base staging actual no permite validar la persistencia del modelo completo de cliente cubano/extranjero, dirección habitual, múltiples destinatarios e historial. Esto **no prueba** que no exista implementación en el frontend o en otra infraestructura; requiere revisar la integración web/servicio y las migraciones previstas. No crear tablas sin contrato de datos aprobado, ni registrar clientes ficticios contra rutas no auditadas.

## Próximas tareas
1. Auditar código fuente de registro/login/checkout y su persistencia efectiva, identificar contratos y validaciones.
2. Preparar propuesta de migración staging para direcciones y destinatarios asociados con controles de acceso y preservación histórica, separada de producción.
3. Diseñar pruebas de Cuba y extranjero, inicio de sesión, sesiones persistentes y destinatarios; ejecutar solo con mecanismo autorizado y aislamiento demostrado.
4. Mantener correo y pedidos reales desactivados. No fusionar PR #1.

## Clasificación
**Bloqueo de cobertura de pruebas, no fallo de cliente reproducido**. Ninguna corrección de datos o esquema aplicada.
