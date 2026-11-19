# ENLACE DIGITAL — auditoría focalizada de permisos y revocación (offline)
Fecha 2026-11-18. Base `29318c240e5007f343d4d20fa040ae47b3db66d2`; comparación inicial: identical.

## Hallazgo concreto
`apply_intent` consumía una intención de revocación y devolvía `LAB_APPLIED_ONLY` aun si la aprobación ya estaba revocada o vencida, porque el `UPDATE ... WHERE revoked_at IS NULL` no afectaba filas pero la intención se marcaba consumida. Se añadieron comprobaciones de `revoked_at` y `expires_at` antes del consumo. Reintento con intención ya consumida sigue devolviendo `PENDIENTE`; la operación es de efecto único, no una confirmación de éxito repetida.

## Permisos y bloqueos
Por inspección, `SELECT ... FOR SHARE` sobre contexto y roles tiene permisos `UPDATE(revision)` y `UPDATE(enabled)` en el propietario técnico; `SELECT ... FOR UPDATE` sobre intenciones tiene `UPDATE(consumed_at)`, y sobre aprobaciones tiene `UPDATE(revoked_at)`. El pool no tiene acceso directo a tablas, solo EXECUTE de `apply_intent`. Estos son contratos de texto, **no permisos efectivamente verificados en PostgreSQL**. El propietario de función conserva capacidad real de escritura sobre columnas concedidas.

## Archivos publicados
- `shared_pool_atomic_lab.sql` corregido.
- `shared_pool_atomic_static.test.js` ampliado (30 comprobaciones textuales previstas, no ejecutadas).
- `atomic_two_connections_revocation.sql`: plan de carrera con dos conexiones, commit y rollback.
- `atomic_privileges_adversarial.sql`: consultas `has_table_privilege`, `has_function_privilege` y acceso directo que debe fallar.

## Riesgos pendientes
- SQL no compilado ni ejecutado: sin PostgreSQL local y sin autorización de descargas. No hay resultados de concurrencia, RLS, persistencia, roles ni permisos.
- La autenticación del gateway, el contexto empresarial autoritativo y la vinculación de roles continúan sintéticos. No se debe usar `session_user` de pool como identidad individual.
- La carrera de revocación frente a resolución final del cobro no está implementada; no se declara resuelta.
- La restricción `UNIQUE(actor_id,operation_id,action)` y `UNIQUE(actor_id,operation_id)` de aprobaciones impide duplicados, pero el tratamiento de errores de inserción y commit desconocido requiere pruebas de dos conexiones.
- Los archivos A/B previos usan una pausa artificial para reproducir bloqueo; la nueva revocación requiere sembrar aprobación e intención sintéticas antes de ejecutar.

**Resultado:** `PENDIENTE` para cualquier autorización de entrega especial no verificada; no modificar checkout.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
