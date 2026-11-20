# ENLACE DIGITAL — identidad de sesión, membresía y RLS offline (2026-11-20)

Base `540d7a87a97802e083d47bbb3157832729007e06`; rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Diagnóstico comprobado por lectura exacta de GitHub
Los wrappers de 029 son SECURITY DEFINER, propiedad de `ed_reconcile_executor`, pero están intencionadamente deshabilitados. Las funciones internas de 025 verifican `current_user<>session_user`: en una función SECURITY DEFINER `current_user` es el propietario, por lo que esa comprobación no puede reutilizarse como prueba de identidad del revisor. La solución segura futura deberá capturar `session_user` y validarlo frente a allowlist con privilegios técnicos, sin aceptar identidades proporcionadas por parámetros ni GUCs editables por el cliente.

El prototipo 029 fija `search_path=pg_catalog,geoapify_disposable`; antes de activar un SECURITY DEFINER debe revisarse y fijarse `pg_temp` al final según la documentación oficial: https://www.postgresql.org/docs/current/sql-createfunction.html . No se activaron los wrappers.

## Implementación offline
- `031_geoapify_identity_boundary_diagnostics.sql`: función SECURITY INVOKER de diagnóstico, revocada a PUBLIC, que comprueba atributos NOLOGIN/no BYPASSRLS, membresías directas e indirectas hacia el ejecutor, revisores superuser/BYPASSRLS, propiedad de tablas sin FORCE RLS y ACL EXECUTE de PUBLIC sobre wrappers.
- `032_geoapify_identity_boundary_tests.sql`: comprobaciones rollback de catálogo, propietario SECURITY DEFINER y configuración de search_path; matriz no ejecutada de dos sesiones, SET ROLE, herencia, objeto temporal, propiedad/RLS, revocación, conflicto y commit desconocido.
- `run_concurrency.py` incluye 031/032 en orden. No se concedieron roles ni privilegios a revisores; wrappers permanecen denegando todo.

## Evidencias realmente ejecutadas
- 031 blob `466e6050c5068e3ebba6ae7ad61f8ffc1f9d5677`: 5/5 inspecciones textuales.
- 032 blob `82cb524afe6f1fee2262071bfd72d9204a16f78c`: 5/5.
- Runner blob `6734de0565026b1a005cf36a56b80d4a7ec10d54`: 3/3.
Total **13/13 comprobaciones estructurales**; sin ejecución de PostgreSQL, SQL, Node.js ni carreras.

## Límites y bloqueantes
- `pg_has_role(...,'MEMBER')` detecta membresías en el catálogo, pero los permisos reales también dependen de INHERIT/SET y de la versión PostgreSQL. Validación en motor pendiente.
- Las consultas RLS detectan un caso específico: propiedad del ejecutor sin FORCE RLS. No prueban la eficacia de políticas ni la cobertura completa de todas las tablas.
- `session_user` identifica la identidad autenticada de conexión, no a una persona física; dos credenciales no equivalen a dos revisores humanos independientes.
- Los wrappers continúan deshabilitados. La ruta positiva de conciliación y sus pruebas con dos roles siguen pendientes. La función de diagnóstico no es un mecanismo de autorización en tiempo de ejecución.
- Sin atomicidad con HTTP externo. Ninguna consulta a servicios reales.

No se instaló PostgreSQL ni se usaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
