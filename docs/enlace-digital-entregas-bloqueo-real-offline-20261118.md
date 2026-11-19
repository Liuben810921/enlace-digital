# ENLACE DIGITAL — comprobación de bloqueo real, solo laboratorio offline
Fecha: 2026-11-18. Base f948dd5bd3a4c76cdb5d5561ed881d1cd32dfa33, comparación inicial identical.

## Cambios
- Sesiones A y B con application_name ed_atomic_lab_a y ed_atomic_lab_b.
- A mantiene transacción durante 18 segundos, B se inicia después de la señal A_LOCK_HELD.
- El ejecutor consulta pg_stat_activity y pg_blocking_pids(b.pid), exige que B tenga wait_event_type='Lock' y que A figure como bloqueador. Si no observa el vínculo, falla cerrado.
- Se añaden cancelación SIGTERM de sesiones activas y tiempo máximo de 35 segundos por sesión. Las consultas psql síncronas ya tenían timeout de 30 segundos.
- Se conservan aserciones de resultados A/B, efectos persistidos y replay.

## Evidencia efectivamente observada
- Se leyó el contenido exacto publicado en GitHub; blob del ejecutor 69e5ba16283683439540e6f264947bbdfbc94a96.
- Se comprobó sintaxis JavaScript mediante parser V8: PASS.
- Se verificó por inspección la presencia de pg_blocking_pids, wait_event_type, cancelación y timeout.
- **No se ejecutó Node como proceso, psql ni PostgreSQL; ninguna prueba de bloqueo fue observada.**

## Límites
- La conexión DBA de observación necesita visibilidad suficiente de pg_stat_activity y pg_blocking_pids. Sin esos permisos, el resultado debe declararse inconcluso, no éxito.
- application_name es identificador de prueba, no autenticación. Requiere base desechable aislada y ausencia de sesiones ajenas con esos nombres.
- El polling tiene ventana finita y puede no observar un bloqueo muy breve. No constituye exploración exhaustiva de todos los interleavings.
- SIGTERM es cancelación cooperativa, no garantía de eliminación forzosa; si el motor queda colgado, intervención del operador.
- La validación local por hostname no prueba aislamiento de infraestructura: ejecutar solo en base desechable administrada expresamente.
- No se verificaron permisos SQL reales, ni integración con gateway, checkout o cotizaciones. Estado comercial PENDIENTE.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
