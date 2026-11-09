# Aceptación estática y criterios pendientes — PR #1

Fecha: 2026-11-09. Revisión del commit `bf6cdc0bb8631292c3bee7773ab1f18e8eaf5d50`.

## Evidencia verificada
- GitHub Actions, run `42651417075`: `completed/success`.
- Job `audit`, ID `129278470879`: `completed/success`.
- Paso `Verify isolated SQL proposal invariants`: `success`.
- PR #1: abierto, borrador, no fusionado; GitHub informa `mergeable=true`.
- Comparación con main: 7 commits ahead, 0 behind; 7 archivos nuevos, ninguno existente modificado.
- La propuesta conserva SECURITY DEFINER, search_path vacío, caducidad de 20 min/24 h e invalidación de tokens pendientes; la condición de cooldown considera tokens consumidos y no consumidos.

## Decisión
**Aceptación estática: APROBADA para revisión técnica del PR, NO para despliegue.**
La ejecución de CI inspecciona invariantes textuales, no compila SQL ni prueba comportamiento PostgreSQL.

## Puertas de aceptación funcional pendientes
1. Ejecutar por una vía autorizada, en el proyecto staging correcto y con reversión garantizada, las 18 aserciones de `sql/staging_correo_integral_rollback.sql`; conservar resultados individuales y resumen PASS/FAIL. No eludir controles que bloqueen la ejecución.
2. Confirmar específicamente la aserción 11: el cooldown de 10 minutos impide una segunda emisión tras consumir el primer token.
3. Comprobar verificación, recuperación, expiración, replay, revocación de sesiones, rehash de contraseña y rate limiting, incluyendo errores y casos límite.
4. Verificar los privilegios EXECUTE de funciones privadas para anon/authenticated y las restricciones de RLS.
5. Revisar concurrencia (emisiones simultáneas) y consistencia temporal del cooldown, además del impacto en UX.
6. Verificar antes y después: cero cambios persistentes de prueba, flags de correo desactivados, sin envío real, sin activación de pedidos y sin cambios a producción.
7. Revisar y autorizar explícitamente cualquier aplicación futura a staging; el PR no despliega la propuesta SQL.

## Restricciones
No fusionar PR #1. No desplegar, modificar Supabase, activar SMTP, correo ni pedidos reales. No afirmar pruebas dinámicas superadas.
