# ENLACE DIGITAL — auditoría focalizada del laboratorio SQL atómico
Fecha 2026-11-18. Base `cdd1fca6e96bbd5af9b16f82a7c459e6311fcca1`; comparación GitHub: identical.

## Defectos demostrables por inspección
1. `shared_pool_atomic_lab.sql` contenía secuencias literales `\\n` en un comentario. La revocación de EXECUTE sobre `consume` y la creación de la tabla siguiente quedaban comentadas en la misma línea física. Corregido con saltos de línea reales.
2. `SELECT ... FOR SHARE` sobre contexto y roles exige privilegios de bloqueo de filas. El propietario técnico solo tenía SELECT, por lo que se añadieron `UPDATE(revision)` y `UPDATE(enabled)` para posibilitar bloqueos, y se redujo la concesión sobre aprobaciones a `SELECT,INSERT,UPDATE(revoked_at)`. **No comprobado en motor**.
3. La prueba estática no cubría privilegios de bloqueo ni el defecto de saltos de línea; se amplió y corrigió el escapado de sus expresiones.

## Material reproducible publicado
- `shared_pool_atomic_lab.sql`: SQL actualizado.
- `shared_pool_atomic_static.test.js`: 28 aserciones textuales preparadas, **no ejecutadas**.
- `atomic_two_connections_setup.sql`: datos sintéticos desechables.
- `atomic_two_connections_A.sql` y `atomic_two_connections_B.sql`: carreras de dos conexiones con `pg_sleep` y transacciones separadas.

Procedimiento futuro: crear una base PostgreSQL desechable, ejecutar en orden `manual_approval.sql`, `shared_pool_intents.sql`, `shared_pool_atomic_lab.sql`, `atomic_two_connections_setup.sql` bajo DBA; asignar login de prueba exclusivamente al rol pool; ejecutar A y B con el mismo `intent_id` y `nonce_hash`. Verificar un único `LAB_APPLIED_ONLY`, un `PENDIENTE`, exactamente una aprobación, y repetir con rollback en A. Para `psql`, sustituir variables `:intent_id` y `:'nonce_hash'` por valores devueltos en setup, sin copiar credenciales.

## Riesgos aún bloqueantes
- La concesión de UPDATE parcial a propietario de función es una capacidad real de escritura; no equivale a RLS demostrada. Requiere aislamiento del propietario y prueba adversarial de permisos.
- La fila `authoritative_context` es sintética, no recomputada de cesta, destino, almacenes y reglas. La identidad de `admin_roles` tampoco se sincroniza con un sistema de autenticación real.
- El diseño actual devuelve `LAB_APPLIED_ONLY`, no habilita checkout; los estados y carreras de revocación frente a uso final no están integrados.
- Falta validar SQL con PostgreSQL: compilación, privilegios efectivos, bloqueos, RLS, serialización, reintentos, errores de commit desconocido y persistencia.
- Los scripts A/B usan `pg_sleep` solo para crear una ventana de carrera en laboratorio. No se ejecutaron.

No se invocaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
