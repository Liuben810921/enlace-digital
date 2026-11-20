# ENLACE DIGITAL — endurecimiento de identidad de revisores (2026-11-20)

Base `5b1e8ee46a2eafe8cb3797e61c970f99d8c65d18`; rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub `identical`.

## Hallazgo y corrección
La migración 023 contaba `count(DISTINCT reviewer)` basándose en `current_user`. PostgreSQL permite `SET ROLE`, que cambia `current_user` pero no necesariamente `session_user`. Un login con membresía en varios roles de revisión podría fingir independencia. Documentación: https://www.postgresql.org/docs/current/functions-info.html

`025_geoapify_reviewer_identity_guard.sql` reemplaza las dos RPC de revisión para exigir `current_user=session_user`. Además, `reconcile_dispatch` rechaza evidencia cuyo reviewer ya no esté en la allowlist. Se conserva el bloqueo advisory, la verificación de dos firmas coincidentes, la conciliación terminal transaccional y la ausencia de GRANTs o roles reales.

`026_geoapify_reviewer_identity_tests.sql` incorpora comprobaciones rollback de definición de RPC, allowlist y evidencia vacías y ausencia de privilegio INSERT de PUBLIC (inspección de ACL por `aclexplode`), más matriz manual de dos logins, discrepancias, revocación, carreras y commit desconocido. `run_concurrency.py` incluye 025/026 en orden.

## Verificación efectivamente ejecutada
- 025 blob `2fec16c113617cc377982c9613d590cd21243913`: 5/5 comprobaciones estructurales.
- 026 blob `d67eeb766a43526e495beca9dd6ba55806a12e69`: 5/5.
- runner blob `cc0fb8b62bd65ab2e8965b4e44a105f3ea56f81b`: 3/3 referencias y orden.
Total: **13/13 comprobaciones textuales**. Se corrigió una prueba que trataba incorrectamente PUBLIC como login y se reemplazó por inspección ACL. **No se ejecutaron SQL, PostgreSQL, Node.js ni dos sesiones reales**.

## Pendientes explícitos
1. La matriz de dos revisores, evidencia conflictiva, revocación, commit ACK perdido y concurrencia **está especificada, no ejecutada**. Requiere PostgreSQL desechable y dos conexiones independientes, sin servicios externos.
2. `session_user` identifica el usuario de sesión de PostgreSQL, no demuestra dos personas físicas. Un operador con acceso a dos credenciales sigue pudiendo firmar dos veces. La separación humana necesita controles externos.
3. Las RPC son SECURITY INVOKER y requieren privilegios mínimos para leer/escribir tablas; no se otorgaron. Dar acceso directo a tablas puede permitir eludir las funciones. Se necesita diseño de roles técnicos seguros y verificación de permisos antes de habilitar la ruta positiva.
4. Una huella de evidencia no demuestra autenticidad del proveedor; aún falta cadena de custodia y verificación externa independiente.
5. El SQL no se validó en motor; no se afirma seguridad de despliegue ni atomicidad con HTTP externo.

No se instaló PostgreSQL ni se usaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
