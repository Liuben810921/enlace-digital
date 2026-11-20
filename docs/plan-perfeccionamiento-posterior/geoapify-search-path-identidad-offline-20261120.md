# ENLACE DIGITAL — search_path seguro e identidad de sesión (2026-11-20)

Base `d436cc3a2f79089b1d255b41f098dd2a2e54c68d`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Defecto comprobado en archivo exacto
En `029_geoapify_executor_nologin_prototype.sql`, ambos wrappers SECURITY DEFINER fijaban `search_path=pg_catalog,geoapify_disposable`, sin colocar `pg_temp` explícitamente al final. La documentación PostgreSQL recomienda `pg_temp` al final para evitar shadowing por objetos temporales: https://www.postgresql.org/docs/current/sql-createfunction.html .

## Corrección offline
- `033_geoapify_definer_search_path_hardening.sql`: ALTER FUNCTION de los dos wrappers deshabilitados con `search_path=pg_catalog,geoapify_disposable,pg_temp`. Añade inspector SECURITY INVOKER sin EXECUTE PUBLIC que verifica configuración exacta, ausencia de logins miembros del ejecutor y ausencia de propiedad del ejecutor sobre cuatro tablas sensibles.
- `034_geoapify_definer_search_path_tests.sql`: comprobaciones SQL rollback y matriz adversarial documentada de SET ROLE, session_user, privilegios heredados, temp shadowing, discrepancias, revocación y ACK de commit desconocido.
- `run_concurrency.py` incorpora 033/034 después de 032.

## Contrato de identidad propuesto, no activado
Una futura implementación SECURITY DEFINER debe derivar la identidad del revisor exclusivamente de `session_user`, comprobar que sea LOGIN autorizado y no privilegiado, no aceptar `current_user` como identidad del revisor ni confiar en GUCs o parámetros proporcionados por el cliente. El ejecutor NOLOGIN debe mantenerse sin membresías accesibles por logins, sin propiedad sobre tablas sensibles y sin BYPASSRLS. La política RLS real y la autenticidad de las evidencias requieren comprobación en PostgreSQL desechable.

## Evidencias realmente ejecutadas
- 033 blob `3012ab013217060b0c6ca1c4d9fa7abf8bb1ee09`: 5/5 verificaciones estructurales.
- 034 blob `e4467b15832486980d07e0b99ce6770d9034812d`: 5/5.
- runner blob `83ed5fbea5c6c25e9ee09e05280b959ffafe0bd3`: 3/3.
Total **13/13 verificaciones textuales**, no SQL ejecutado. La ruta positiva de doble revisión permanece deshabilitada y sin pruebas con dos sesiones.

## Limitaciones
La inspección de membresía y propiedad no sustituye pruebas de roles efectivos, FORCE RLS, privilegios heredados, control de propiedad, evidencia independiente ni carreras. El SQL no se ha compilado ni ejecutado en PostgreSQL. No se promete atomicidad con HTTP externo.

No se instaló PostgreSQL ni se utilizaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
