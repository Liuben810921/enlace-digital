# Preflight HTTP/Edge solo lectura — ENLACE DIGITAL PR #2

Fecha: 2026-11-09. Referencia: `e6f1b96d2d727ca8db9edbcbc579e1f92232f48e`.

## Evidencia verificada

- GitHub Actions del commit de integración SQL: run `42713024560`, **success**.
- Proyecto Supabase staging `xqahthghvozeigbojhyi`: `ACTIVE_HEALTHY`, PostgreSQL 17.11, listado Edge Functions vacío. No se consultó ni modificó producción.
- Código GitHub `supabase/functions/enlace-cliente-auth-staging/index.ts`: usa dependencia versionada `@supabase/supabase-js@2.49.10` desde esm.sh; los checks offline usan Deno v2.x (no versión exacta). No se verificó integridad del CDN ni existe lockfile de Deno verificado en esta revisión.
- Gate de activación: `ED_STAGING_CUSTOMER_AUTH_ENABLED === 'true'`, validación exacta del hostname de staging y presencia de `SUPABASE_SERVICE_ROLE_KEY`. El controlador responde 503 si falla un gate; su inicialización de Supabase se difiere hasta después de esos checks.
- CORS: solo origen HTTPS explícito `ED_STAGING_ALLOWED_ORIGIN`, `POST/OPTIONS`, cabeceras `content-type,apikey,authorization`. El código no permite cualquier origen. **No se confirmó el origen real del sitio de pruebas**.
- Tokens: login genera 32 bytes aleatorios, los entrega como 64 caracteres hexadecimales y almacena SHA-256 mediante RPC; son tokens propios, **no JWT Supabase Auth**. El SQL de sesión comprueba caducidad/revocación. El token debe protegerse en el navegador; no se probó aún el flujo HTTP real.
- Limitador: por falta de IP proxy confiable se usa una clave IP compartida `unverified-proxy`; puede afectar simultáneamente a distintos clientes. Además existe límite global y por teléfono. Debe evaluarse el impacto en el piloto antes de habilitar tráfico.
- SQL staging: la batería integral anterior terminó sin error y los conteos posteriores fueron cero; **no sustituye una prueba HTTP desde navegador**.
- Supabase Security Advisors: aviso informativo `rls_enabled_no_policy` en ocho tablas, incluyendo clientes y destinatarios; coherente con acceso privado vía service_role y RPC, pero verificar los grants antes de producción. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## JWT, claves y dependencias

- `verify_jwt=true` en gateway Edge puede rechazar clientes sin JWT de Supabase antes de llegar al controlador. El diseño debe decidir la invocación pública segura (por ejemplo configuración revisada del gateway, clave publicable y controles antiabuso) antes del despliegue; **no se cambió verify_jwt ni configuración**.
- Nunca enviar `SUPABASE_SERVICE_ROLE_KEY` al navegador, ni incorporarla a GitHub Pages. Clave publicable/anon solo como identificador de cliente, no como autorización de identidad. Referencia: https://supabase.com/docs/guides/getting-started/api-keys
- Dependencia `esm.sh/@supabase/supabase-js@2.49.10` versionada, pero no fijada con integridad de artefacto. Recomendable fijar lockfile/versión de Deno y evaluar dependencias antes de producción; no constituye bloqueo para las comprobaciones ya hechas.
- No se encontró `supabase/config.toml` en esta rama; por tanto **no está demostrada la configuración real de verify_jwt**. No hay función desplegada que permita leer su configuración efectiva.

## Permisos de despliegue y reversión

- La integración de herramientas disponible expone `deploy_edge_function` pero **no** `delete_edge_function`. Una consulta de listado vacío no demuestra capacidad de eliminación; no es posible verificar ese permiso de manera concluyente mediante las acciones actuales sin usar una vía administrativa autorizada que permita consultar la capacidad y efectuar la reversión.
- **Bloqueo exclusivo del despliegue:** antes de cualquier despliegue, acreditar permisos para eliminar/revertir Edge Functions mediante un procedimiento autorizado; documentar quién ejecutará la reversión, cómo se verificará y qué hacer si falla. No desplegar para comprobar permisos.

## Próximas decisiones, sin autorización implícita

1. Confirmar origen HTTPS exacto de GitHub Pages staging, contrato del cliente web, headers y estrategia de JWT para invocación pública segura.
2. Verificar por una vía administrativa autorizada los permisos efectivos para eliminar Edge Functions y el procedimiento de reversión; no hacer escrituras ni desplegar hasta confirmar.
3. Pedir autorización independiente para un despliegue **inicialmente desactivado** en staging y pruebas HTTP controladas, con revisión previa de seguridad de configuración, secretos y costos. No activar correos ni pedidos reales.

**Esta revisión fue de solo lectura:** sin escrituras SQL, migraciones, despliegues, cambios de secretos, roles, configuración o producción.
