# G4 — pruebas sintéticas de seguridad, 2026-11-11

Alcance autorizado: exclusivamente GitHub Actions con PostgreSQL 17 desechable; no Supabase staging/producción, clientes históricos, servicios, correos ni pedidos reales.

## Artefactos
- `.github/workflows/g4-isolated-roles-rls-sessions.yml`: servicio efímero PostgreSQL 17, permisos de GitHub solo `contents: read`, sin secretos Supabase.
- `sql/pruebas/g4_isolated_roles_rls_sessions.sql`: fixture autocontenida dentro de BEGIN/ROLLBACK, roles sintéticos sin BYPASSRLS, políticas del propietario, función privilegiada con búsqueda restringida y comprobaciones negativas.

## Cobertura
1. `anon` y `authenticated` sintéticos sin SELECT de credenciales/sesiones/destinatarios ni EXECUTE de RPC privada.
2. RLS y FORCE RLS en tres tablas.
3. Hash de contraseña con bcrypt y hash SHA-256 de token, sin almacenamiento de textos originales.
4. Dos identidades sintéticas con acceso al destinatario propio y denegación del ajeno.
5. Rechazo de token inválido, sesión revocada y sesión caducada.
6. Transacción revertida; no quedan datos de prueba persistentes en el contenedor de CI.

## Límites
Es un modelo sintético, no una prueba de las funciones reales de staging. No verifica controladores HTTP, permisos de producción, autenticación real ni concurrencia. Las pruebas F6-B18 a F6-B30 existentes cubren aspectos complementarios de concurrencia e idempotencia. El estado de CI debe verificarse después del commit; no inferir PASS de un archivo creado.

## Estado
Código y workflow incorporados a rama de auditoría. La consulta de ejecuciones por el commit inicial devolvió lista vacía; **CI aún no verificado**. No autoriza despliegue, fusión ni activación.

## Verificación posterior — 2026-11-11
- G4 #1 (commit `1c9eafd`) y #2 (commit `5f92662`): fallo en la instalación de `postgresql-client` por DNS temporal de `security.ubuntu.com`; las aserciones SQL no llegaron a ejecutarse. Log de #1 obtenido directamente del job `130586813284` en la ejecución `43039397105`.
- Corrección exclusivamente del workflow en commit `dfe5f1a`: ejecución de `psql` dentro del contenedor efímero PostgreSQL 17; se elimina `apt-get`.
- G4 #3 (commit `dfe5f1a`): **SUCCESS**, confirmado mediante captura de GitHub Actions aportada por el propietario, duración 26 segundos. La herramienta conectada no lista este workflow por commit y aún no se recuperó su job/log específico. La marca verde prueba éxito de workflow, no equivalencia con seguridad de staging.
- `staging-edge-draft-security` #33: SUCCESS verificado por conector para el mismo commit. `f6b13-isolated-postgres-security` #186: en progreso al consultar; no atribuir éxito.
- No se ejecutaron SQL ni RPC contra Supabase, ni se consultaron clientes ni se desplegaron servicios.

**Estado:** G4 sintético aprobado por GitHub Actions #3; queda pendiente validación integrada independiente y aprobación explícita antes de cualquier cambio de staging.
