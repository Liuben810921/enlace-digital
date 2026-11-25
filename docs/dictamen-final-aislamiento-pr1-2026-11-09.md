# Dictamen final de aislamiento de staging y PR #1 — 2026-11-09

## Verificación de solo lectura
- Proyecto `xqahthghvozeigbojhyi`: staging, `ACTIVE_HEALTHY` (comprobación anterior).
- Cinco tablas de datos de prueba vacías y tres flags de correo en `false` (comprobación anterior).
- Sin Edge Functions; sin triggers no internos en `public`/`enlace_auth`; sin `pg_cron`, `pg_net` ni `http` instalados (comprobaciones anteriores).
- Extensiones instaladas: `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`.
- Funciones privadas `enlace_auth.ed_emitir_token_correo_privado` y `ed_consumir_token_correo_privado`: `SECURITY DEFINER`, `search_path` vacío, sin permiso EXECUTE para `anon`/`authenticated`.
- Funciones públicas de servicio `public.ed_correo_emitir_token_servicio` y `ed_correo_consumir_token_servicio`: EXECUTE denegado a `anon` y `authenticated`, concedido a `service_role`.
- Seis tablas examinadas: RLS activo y sin permiso SELECT para `anon`/`authenticated`.
- Supabase Security Advisor: 6 avisos informativos `rls_enabled_no_policy` (tablas de clientes y del esquema privado). No equivalen automáticamente a vulnerabilidad; requieren revisión contextual. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- `pg_get_functiondef` confirma que el cooldown de la función instalada excluye tokens consumidos. La propuesta correctiva permanece sin desplegar.
- GitHub Actions commit `c31b4db573115bc986cdf5fa67c6410c3a40b562`: run `42651907019`, `completed/success`.
- PR #1: abierto, borrador, `merged=false`, `mergeable=true`.

## Riesgos residuales
1. No se ha demostrado ausencia total de hooks o servicios externos ajenos a los esquemas examinados. La presencia de `supabase_vault` no demuestra que existan credenciales o envíos; no se inspeccionaron secretos.
2. El archivo de 18 pruebas habilita temporalmente los tres flags dentro de una transacción. ROLLBACK revierte datos SQL, pero no puede deshacer efectos externos ya iniciados.
3. No se ha demostrado que el operador disponga de una sesión PostgreSQL única, permiso de ejecución y una política que autorice pruebas transaccionales. No eludir bloqueos.
4. La prueba 11 probablemente falla con la función actual; no se ha ejecutado y no debe marcarse FAIL observado.
5. Los tests no cubren carreras concurrentes, integración de email ni todas las rutas externas.

## Dictamen de preparación
**READY FOR AUTHORIZED OPERATOR REVIEW; NOT READY TO EXECUTE UNCONDITIONALLY.** El script y las instrucciones están preparados, pero un operador autorizado debe confirmar identidad, sesión única, permisos y aislamiento externo inmediatamente antes de ejecutarlo. No ejecutar si falla cualquiera de estas puertas. No aplicar propuesta SQL ni fusionar PR #1.

## Cambios
Solo este documento en GitHub, rama aislada. Sin cambios a Supabase, producción, correo ni pedidos.
