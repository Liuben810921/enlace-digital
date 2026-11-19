# ENLACE DIGITAL — corrección de identidad SQL, solo laboratorio
Fecha 2026-11-18. Base `4cd3a0acc48d04a722e27d120450fb57abd021b9`; comparación inicial `identical`.

## Defecto demostrado por inspección
`current_setting('ed_delivery_lab.trusted_actor')` era una identidad falsificable: cualquier cliente con SQL podría ejecutar `set_config` y suplantar un actor. Se eliminó de `approve` y `revoke`; ahora se usa `session_user` de la autenticación PostgreSQL, que no cambia mediante `SET ROLE`. Las concesiones administrativas se consultan desde `actor_grants` y se requieren roles `principal` o `general` habilitados.

**Restricción crítica:** esto solo es válido si cada administrador accede mediante una identidad PostgreSQL individual, autenticada por un servidor confiable, sin credenciales SQL expuestas al navegador. Un pool compartido que conecte todos los administradores como un único usuario SQL NO identifica al actor. Para ese modelo se necesita una capa de autorización distinta, aún no diseñada ni comprobada. Tampoco protege de superusuarios, propietario de funciones o un backend comprometido.

## Archivos
- `manual_approval_rpc.sql`: identidad derivada de `session_user`, sin GUC manipulable.
- `seed_disposable.sql`: roles LOGIN de prueba `ed_lab_owner`, `ed_lab_viewer` como prerrequisito explícito.
- `two_sessions_A.sql`, `two_sessions_B.sql`: sesiones autenticadas, sin actor suministrado por cliente.
- `check_rpc_static.js`: controles textuales adicionales para identidad SQL.
- `adversarial_permissions.sql`: rechazo de supervisor y denegación de acceso directo a tablas.

## Pruebas pendientes de ejecución
En PostgreSQL local desechable, crear roles y permisos desde DBA, ejecutar schema/RPC/seed, conectar A y B como `ed_lab_owner`, y el adversarial como `ed_lab_viewer`. Comprobar:
1. `session_user` conserva identidad al hacer `SET ROLE`.
2. Supervisor obtiene `PENDIENTE` al aprobar y revocar.
3. Acceso directo a `approvals` y `actor_grants` se deniega.
4. A/B reintentan operación idéntica: una sola fila y `EXISTING`; payload diferente `CONFLICT`.
5. Revocación bloquea reintento; vencimiento y cambio de revisión devuelven `PENDIENTE`.
6. Reinicio y reconexión conservan registros.

**No ejecutadas:** no hay PostgreSQL local. No se han comprobado sintaxis PL/pgSQL, transacciones, RLS, roles reales ni persistencia. El validador estático no prueba semántica SQL.

## Bloqueantes adicionales
- El esquema usa `SECURITY DEFINER`; debe migrarse a propietario técnico mínimo, permisos explícitos y esquema cerrado a creación por usuarios. Actualmente no hay demostración de RLS efectiva dentro de las RPC.
- `context_state` aún contiene una huella ficticia, no derivada transaccionalmente de cesta, destino, almacenes y reglas verificadas.
- Los scripts requieren creación manual de `ed_delivery_lab_api NOLOGIN` y usuarios LOGIN desechables; nunca usar usuarios de producción.
- Los guiones adversariales incluyen sentencias que **deben fallar**; el operador debe verificar sus errores esperados, no ignorarlos.
- No activar cobros ni checkout. Opción C permanece `PENDIENTE` sin verificación real.

Sin GitHub Actions, Supabase, staging, producción, pedidos, descargas, despliegues, cartografía ni costos.
