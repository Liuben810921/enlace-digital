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


## Anexo — Comparación de proveedores y comprobación de staging (2026-11-12)

### Evidencia de lectura
- `get_project` volvió a confirmar `enlace-digital-staging` con `ACTIVE_HEALTHY` y PostgreSQL `17.11.0.018`.
- `list_edge_functions` volvió a devolver `{"functions":[]}`.
- Las herramientas de administración de Supabase disponibles en esta sesión no ofrecen una lectura directa y segura de la configuración hospedada de Auth (Email Provider, SMTP, redirect URLs, rate limits y contraseña mínima). **No se ha afirmado que los valores históricos sigan vigentes**. Se requieren capturas administrativas o una herramienta de lectura específica, sin revelar credenciales.
- No se ha consultado ninguna tabla de clientes, usuario real, sesión, secreto o correo.

### Comparativa verificada de planes publicados
| Proveedor | Gratis | SMTP | Condiciones relevantes |
|---|---|---|---|
| Brevo | 300 envíos/día, $0, sin tarjeta requerida para Free | Sí, `smtp-relay.brevo.com` | El envío transaccional puede requerir activación de soporte; sin dominio propio autenticado, Brevo puede reemplazar el remitente Gmail por un dominio suyo |
| Resend | 3.000/mes y 100/día, $0 | Sí, `smtp.resend.com` | Hasta 3 dominios verificados; recomendable dominio propio para autenticación |
| MailerSend | 500/mes y 100/día, $0 | Sí | Exige aprobación y datos de tarjeta para el plan Free; 100 solicitudes/día; 1 dominio |

### Recomendación y bloqueos
**Primera opción provisional: Brevo**, por cuota gratuita y compatibilidad SMTP. No autorizar registro ni activación hasta:
1. Confirmar elegibilidad de ENLACE DIGITAL como empresa operando en Cuba y condiciones de envío a buzones cubanos y extranjeros; no hay evidencia suficiente para garantizarlo. Evaluar condiciones de servicio/sanciones y obtener respuesta expresa del proveedor.
2. Decidir si se adquiere un dominio propio y verificar SPF/DKIM/DMARC. El Gmail `enlacedigital.tecnologias@gmail.com` se mantiene como buzón oficial, no es dominio autenticable de envío de terceros.
3. Confirmar por lectura los ajustes hospedados de Auth en staging: SMTP personalizado, Email Provider, Auth Hooks, Site URL, redirect allowlist, mínimo de contraseña, rate limits y CAPTCHA.
4. Autorizar por separado cualquier creación de cuenta de proveedor, verificación de dominio, modificación de staging, pruebas reales de entrega o gasto.
5. Mantener GoTrue/Mailpit como pruebas sintéticas sin tráfico de correo real. La entrega real a Cuba solo puede validarse tras autorización y pruebas de recepción en direcciones controladas.

### Fuentes oficiales consultadas
- Supabase SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase changelog: https://supabase.com/changelog.md (CLI v3 cambio incompatible, 2026-11-04; no actualizar CI implícitamente)
- Brevo Free: https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- Brevo pricing: https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans
- Brevo SMTP: https://help.brevo.com/hc/es/articles/7924908994450-Enviar-emails-transaccionales-con-Brevo-SMTP
- Brevo activation: https://help.brevo.com/hc/es/articles/115000188150-Soluci%C3%B3n-de-problemas-relacionados-con-Brevo-SMTP
- Brevo domain and free Gmail restriction: https://help.brevo.com/hc/es/articles/12163873383186-Autenticar-el-dominio-con-Brevo-c%C3%B3digo-Brevo-DKIM-DMARC
- Brevo sender rewriting: https://help.brevo.com/hc/es/articles/14925263522578-Cumplir-los-requisitos-de-Gmail-Yahoo-y-Microsoft-para-remitentes-de-email
- Resend pricing: https://resend.com/pricing
- Resend SMTP: https://resend.com/changelog/smtp-service
- MailerSend free plan: https://www.mailersend.com/help/plans-features-and-limits
- MailerSend pricing/card requirement: https://www.mailersend.com/pricing
