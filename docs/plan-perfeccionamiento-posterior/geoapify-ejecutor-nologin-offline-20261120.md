# ENLACE DIGITAL — prototipo de ejecutor NOLOGIN (2026-11-20)

Base `af20984abde6cc18b0d1077f4613cdd8cd33c39d`, rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Código offline
- `029_geoapify_executor_nologin_prototype.sql`: define rol técnico `ed_reconcile_executor` NOLOGIN, NOSUPERUSER, NOBYPASSRLS, sin privilegios de creación permanentes. Otorga al ejecutor solo privilegios de tabla necesarios para un prototipo de transición, y crea dos wrappers SECURITY DEFINER con propietario técnico, revocados a PUBLIC.
- Ambos wrappers están **deliberadamente inhabilitados** y retornan false / EXECUTOR_NOT_ACTIVATED. No reciben GRANT EXECUTE para revisores. Esto evita convertir el defecto de identidad `current_user<>session_user` de las RPC internas en una vía insegura.
- `030_geoapify_executor_nologin_tests.sql`: aserciones rollback sobre atributos del rol, propietario de wrappers, `prosecdef`, ausencia de CREATE sobre esquema, privilegios de escritura excesivos y ACL de PUBLIC. Matriz manual pendiente: dos logins, SET ROLE, discrepancias, revocación, carrera y commit ACK desconocido.
- `run_concurrency.py` referencia 029 y 030 después de 028.

## Evidencias ejecutadas
- 029 blob `7e1fd79d7eda6b1208b18501636e7fd7fad0614f`: 5/5 verificaciones textuales.
- 030 blob `c6bddf77906a96ee5e258c01e244eea56e4ada43`: 5/5.
- runner blob `4ee491552376e1ff3fa6ec1c2a262d78c96080c5`: 3/3.
Total **13/13 comprobaciones estructurales**, ninguna ejecución SQL, PostgreSQL, Node.js o concurrencia real. Se corrigió la inspección incorrecta de PUBLIC como login, usando `pg_catalog.aclexplode`.

## Riesgos y bloqueantes
1. El SQL es un prototipo que requiere un operador autorizado con permisos para CREATE ROLE, GRANT y ALTER OWNER. Transferir propiedad puede requerir membresía temporal en el rol destino y CREATE sobre el esquema; esas precondiciones NO han sido verificadas. No se debe ejecutar fuera de una base desechable.
2. Los wrappers no realizan conciliación; no hay ruta positiva habilitada. Habilitarlos requiere reescribir y verificar las funciones internas para conservar la identidad de sesión bajo SECURITY DEFINER, sin introducir suplantación mediante SET ROLE o privilegios heredados.
3. El rol técnico dispone de INSERT en reservation_event y UPDATE de columnas de reservation para ejecutar la transición; esto exige verificar rigurosamente que ningún revisor pueda adquirir sus privilegios por membresía, SET ROLE, herencia o propiedad.
4. El propietario técnico NOLOGIN y sin BYPASSRLS no garantiza RLS efectiva si posee tablas o existen políticas permisivas. Deben probarse FORCE ROW LEVEL SECURITY, políticas y el grafo de GRANTs con un PostgreSQL desechable autorizado.
5. La matriz de dos revisores, discrepancias, revocación, concurrencia y ACK perdido está documentada, pero **no ejecutada**. No se afirma atomicidad con HTTP externo.

No se instalaron PostgreSQL ni se usaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
