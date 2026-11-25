# Checklist final para operador autorizado — PR #1

Fecha: 2026-11-09. **Lista de verificación, no autorización de ejecución.**

## Estado de la revisión
- Commit revisado: `c8b692e7f263457388ed55e93eaaf1c9ee427ce9`.
- GitHub Actions run `42652023801`: `completed/success`; job `audit` y paso de invariantes SQL: `success`.
- PR #1: abierto, en borrador, no fusionado; 11 commits ahead de main, 0 behind, 11 archivos nuevos.
- Documentos revisados: aceptación estática, dictamen de aislamiento, procedimiento de 18 pruebas, auditoría Actions, preflight y resultado CI. Consistentes en **no haber ejecutado** las 18 pruebas funcionales y **no haber desplegado** la propuesta. Los informes de CI antiguos describen el estado de sus commits respectivos, no el estado actual.
- Resultado: **apto para revisión de operador; NO habilitado para ejecución sin preflight operativo**.

## Checklist de bloqueo obligatorio
- [ ] Confirmar identidad del proyecto staging `xqahthghvozeigbojhyi` desde el panel y desde la conexión autorizada; nunca producción.
- [ ] Confirmar acceso PostgreSQL aprobado, permisos suficientes, sesión única y gestión de errores que garantice `ROLLBACK`.
- [ ] Confirmar que las cinco tablas de pruebas están vacías y los tres flags siguen apagados inmediatamente antes de comenzar.
- [ ] Confirmar aislamiento operativo de cualquier canal externo, incluidas integraciones fuera de los esquemas revisados. La ausencia de Edge Functions, triggers y extensiones de red no prueba aislamiento absoluto.
- [ ] Confirmar que no hay procesos concurrentes ni datos reales afectados en staging.
- [ ] Confirmar autorización específica para operaciones de prueba que escriben temporalmente dentro de una transacción. Si el control de acceso bloquea, **no eludirlo**.
- [ ] Validar con operador que el cliente ejecuta todo `sql/staging_correo_integral_rollback.sql` en una sola sesión, desde `BEGIN` hasta `ROLLBACK`, y captura resultados antes del rollback.
- [ ] Registrar las 18 filas PASS/FAIL y el resumen; la aserción 11 está **predicha** como FAIL para el código actual, no observada.
- [ ] Tras cerrar transacción, verificar por lectura conteos, flags y ausencia de efectos externos; detenerse ante cualquier discrepancia.
- [ ] Antes de cualquier futura aplicación de la propuesta a staging, exigir autorización distinta, respaldo, revisión de concurrencia y plan de reversión.
- [ ] Mantener PR #1 en borrador, no fusionar ni desplegar a producción.

## Referencias
- `docs/procedimiento-final-18-pruebas-staging-2026-11-09.md`
- `docs/dictamen-final-aislamiento-pr1-2026-11-09.md`
- `docs/aceptacion-estatica-pr1-2026-11-09.md`
- `sql/staging_correo_integral_rollback.sql` (main)
- `sql/propuestas/staging_cooldown_consumido.sql` (rama de auditoría)

## Riesgo residual y decisión
No hay evidencia de ejecución dinámica ni prueba de aislamiento externo total. El script de prueba habilita temporalmente flags dentro de una transacción; ROLLBACK no revierte efectos externos. **GO para revisión manual del operador; NO-GO para ejecución automática, fusión o despliegue.**
