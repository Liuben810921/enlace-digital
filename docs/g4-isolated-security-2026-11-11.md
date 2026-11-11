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
