# Auditoría focalizada del runner offline — 2026-11-18
Base `68346a2a88ded2850f39fb3f746cc24425c47e8a`; comparación inicial idéntica.

## Correcciones publicadas por inspección
- Validación explícita de protocolo PostgreSQL, host local, nombre de base no vacío, exclusión de `postgres/template0/template1`, igualdad de bases de conexiones admin/pool y ausencia de esquemas del laboratorio antes de inicializar.
- Handshake `\\echo A_LOCK_HELD` después de aplicar la intención dentro de transacción A, antes de la pausa de 8 s; el runner espera esa marca antes de iniciar B. Sustituye el uso ambiguo de una coincidencia en la salida del SELECT como señal de sincronización.
- Captura de rechazo temprano de proceso A mientras se espera la señal.

## Limitaciones no resueltas
- El handshake prueba que A alcanzó el punto posterior a `apply_intent`, **no prueba por sí solo** que B esperó un bloqueo PostgreSQL. Para demostrarlo se requiere comprobar `pg_blocking_pids`/estadísticas con permisos apropiados o un protocolo de sincronización independiente; no se ha implementado.
- El ejecutor no dispone de una política completa de cancelación de procesos si falla el handshake, ni de validación de URL frente a redirecciones Unix/socket o configuraciones PG* externas. Debe utilizarse solo en un entorno local aislado administrado por el operador.
- El ejecutor comprueba resultados y postcondiciones de commit/rollback, revocación y replay; no automatiza todos los casos negativos de privilegios ni conflictos.
- No hay motor PostgreSQL disponible en esta tarea. **0 pruebas SQL, 0 ejecuciones del runner y 0 pruebas Node realizadas**. El contenido se revisó directamente desde GitHub; publicación no implica ejecución.
- No hay integración con gateway real, autorización comercial ni checkout. Estado `PENDIENTE`.

No se invocaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
