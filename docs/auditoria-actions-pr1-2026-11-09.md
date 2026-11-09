# Auditoría GitHub Actions — PR #1 — 2026-11-09

## Evidencia
- Tanto `main` como la rama tenían inicialmente solo `.github/workflows/verify-storefront.yml` (mismo blob `bc9bafc9247fb0387f17aae9221e12d6743990a7`).
- Su disparador `pull_request.paths` incluye únicamente `index.html` y el propio workflow. El PR #1 inicialmente modificaba solo `docs/` y `sql/propuestas/`, por lo que no cumplía el filtro.
- En `push`, ese workflow está limitado a `main`; el job `gmail_diagnostic` solo corre en eventos push. La tarea `syntax` incluye consultas HTTP a un endpoint desplegado, por lo que no debe reciclarse para auditar la propuesta SQL.
- La lectura de protección de rama `main` devolvió HTTP 403 (integración sin permiso); la lectura de `actions/workflows` y `actions/permissions` no está disponible por la ruta permitida del conector. **No se puede confirmar el estado administrativo de Actions ni los required checks.**
- El PR estaba abierto y en borrador. Las consultas de estados y ejecuciones para el commit previo no devolvieron resultados; eso no demuestra que Actions esté deshabilitado.

## Cambio aislado
Se añadió `.github/workflows/audit-cooldown-static.yml` exclusivamente en la rama del PR, con disparador por cambios de la propuesta y del propio workflow, permisos `contents: read`, checkout sin credenciales persistentes, timeout de 2 minutos y aserciones Python sobre texto SQL. No usa secretos, `curl`, `psql`, SMTP, endpoints Supabase ni comandos que apliquen la propuesta. El workflow tiene además disparador manual, que no se ha ejecutado.

## Estado de validación
Archivo del workflow recuperado y revisado en GitHub. Inmediatamente después del commit `8669be48`, el conector devolvió cero estados y cero ejecuciones de PR para ese SHA. **No se afirma que el job haya pasado.** Las ejecuciones pueden aparecer más tarde o depender de políticas de GitHub.

## Pendientes
1. Verificar en la interfaz GitHub Actions si el workflow se registra y ejecuta; comprobar resultado y logs sin disparar jobs con acceso externo.
2. No fusionar PR #1 ni desplegar el SQL hasta completar la batería dinámica de 18 aserciones por una vía autorizada.
3. Si se requiere cambiar permisos administrativos de Actions o branch protection, solicitar autorización y usar la interfaz de GitHub con un administrador.
