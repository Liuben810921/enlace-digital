# Auditoría preliminar: correo empresarial y Supabase Auth — 2026-11-12

## Alcance y prohibiciones
Revisión de solo lectura de GitHub, Supabase staging y documentación pública. Sin consultas de clientes, sin envíos, sin cambios de Auth, sin despliegues, sin cambios en producción. Este documento no autoriza habilitar SMTP.

## Evidencia verificada
- Proyecto staging `xqahthghvozeigbojhyi` (`enlace-digital-staging`): `ACTIVE_HEALTHY`, PostgreSQL 17.11, región us-east-1, consultado mediante get_project el 2026-11-12.
- `list_edge_functions` en staging devolvió `functions: []`.
- En rama `audit/f6b21-identity-idempotency-20261110`, `tests/g4_gotrue_local/check_flows.py` usa `auth:9999` y `mailpit:8025`, destinos permitidos explícitamente; bloquea URL externas, dominios imitadores, loopback y puertos inválidos. Verificación por lectura del archivo; NO se ejecutaron pruebas en esta auditoría.
- Para commit `50ec0f02c36281615c4dfb1365a019cb9eff9e40`, consulta de workflow runs devolvió `f6b13-isolated-postgres-security` y `staging-edge-draft-security` completados con `success`. G4 y F6-B21 fueron verificados en la sesión anterior; esta consulta específica no los volvió a devolver.
- Capturas previas del propietario: proveedor Email habilitado, SMTP personalizado desactivado, Auth Hooks vacíos, expiración OTP 3600 s, OTP 8 dígitos, longitud mínima de contraseña configurada en 6 (la política del sitio exige 8). No se pudo confirmar por API el estado actual de estas opciones: **requieren verificación visual administrativa actualizada**.

## Compatibilidad
- Supabase Auth admite SMTP personalizado con host, puerto, usuario, contraseña y remitente. La cuenta Gmail empresarial puede servir para administración humana, pero su mera creación y verificación en dos pasos NO configura SMTP ni garantiza que sea un proveedor transaccional adecuado.
- La documentación oficial de Supabase (actualizada 2026-10-31) dice que su SMTP por defecto es solo para desarrollo, restringe destinatarios a integrantes del equipo y aplica actualmente 2 mensajes/hora; al activar SMTP personalizado se habilitan envíos a otros destinatarios, con límite inicial documentado de 30 mensajes/hora. **Por tanto activar SMTP es una acción sensible, no una comprobación inocua**.
- Preferir un proveedor transaccional con plan gratuito confirmado, remitente/dominio verificable, SPF/DKIM/DMARC y credenciales separadas del Gmail de los socios. Comprobar términos y disponibilidad por país antes de elegir proveedor. No prometer costo cero sin verificar cuotas y límites.
- La cuenta Gmail compartida entre socios exige procedimientos de recuperación y roles; no guardar contraseñas, códigos de respaldo, tokens ni credenciales SMTP en GitHub.

## Riesgos y controles previos
1. Correo no solicitado por flujos de registro, recuperación y reenvío: mantener NO-GO para staging HTTP y envíos hasta constatar configuración efectiva y autorizar pruebas.
2. Desalineación de contraseña: alinear mínimo de Supabase con política >=8 solo con autorización posterior.
3. Abuse/rate limits: cooldown por cuenta y por destino, CAPTCHA cuando proceda, evitar enumeración, tokens de un solo uso, expiración y revocación.
4. Redirect URLs: permitir solo orígenes exactos y rutas de recuperación; comprobar enlaces antes de habilitar.
5. No usar secretos en frontend o CI logs; preferir secret manager del proveedor; rotación y reversión documentadas.
6. No tratar los resultados de Docker/Mailpit como prueba de entregabilidad real ni de configuración hospedada.
7. Verificar impacto del cambio Supabase CLI v3 (2026-11-04) antes de actualizar cualquier CI: comportamiento local por defecto.

## Pruebas sintéticas autorizables sin correo real
- G4 GoTrue + Mailpit aislados: registro, confirmación, recuperación, cooldown, expiración, replay, rate limiting, invalidación de tokens, redirecciones y aislamiento de red.
- PostgreSQL desechable: permisos mínimos, RLS, rollback y no exposición de credenciales.
- No se han ejecutado nuevos workflows en esta auditoría.

## Puertas de autorización para la siguiente fase
A. Solo lectura adicional de configuración actual de Auth/SMTP/redirect/rate limits mediante capturas o API administrativa de lectura que no revele secretos.
B. Selección y evaluación del proveedor de correo, presupuesto y requisitos.
C. Autorización independiente para configurar exclusivamente staging (SMTP, URL de retorno y parámetros), con plan de reversión, y para pruebas de entrega sintéticas a direcciones expresamente aprobadas. Nunca activar producción ni pedidos reales de forma implícita.

## Fuentes
- https://supabase.com/docs/guides/auth/auth-smtp (consultada 2026-11-12)
- https://supabase.com/changelog.md (consultada 2026-11-12)
- GitHub: `tests/g4_gotrue_local/check_flows.py` en `audit/f6b21-identity-idempotency-20261110`
