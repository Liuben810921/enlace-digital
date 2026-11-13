# ENLACE DIGITAL — Endurecimiento RLS del prototipo PostgreSQL desechable

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **CI final:** [GitHub Actions 43506441603](https://github.com/Liuben810921/enlace-digital/actions/runs/43506441603) — `completed/success`.

## Cambios comprobados

- Rol propietario de RPC `ed_lab_rpc_owner`: `NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`. Las dos funciones `SECURITY DEFINER` pertenecen a ese rol, no al superusuario.
- `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY` en las cinco tablas `carts`, `routes`, `settings`, `quotes` y `audit`. Las políticas de SELECT, INSERT y UPDATE aplican a las operaciones ejecutadas por las RPC.
- Los gestores y el administrador de prueba se conectan como **usuarios PostgreSQL autenticados distintos**, no mediante `SET ROLE` desde una sesión superusuario. Dentro de la RPC, `session_user` identifica al usuario de conexión incluso cuando `current_user` cambia al propietario `SECURITY DEFINER`. No se confía en GUC de actor controlable por el cliente.
- Se verifican por catálogo: propietario no superusuario/no BYPASSRLS/no LOGIN, las dos funciones con el propietario previsto, cinco tablas con RLS forzada y ausencia de privilegios directos de UPDATE de cestas o DELETE de auditoría para el propietario.
- Se prueba que un gestor no puede `SET ROLE` al propietario RPC ni a otro gestor; tampoco puede leer otra cesta, alterar tarifas, leer auditoría o modificar tablas directamente.
- Se mantienen pruebas de idempotencia con ocho sesiones concurrentes, aislamiento entre gestores, promociones, cambio de tarifa con auditoría y rechazo de versión obsoleta.

## Fallos detectados y corregidos

1. **Primer fallo: permiso de bloqueo.** `SELECT ... FOR SHARE` sobre cestas requería privilegios de UPDATE que el propietario mínimo no tenía. Se sustituyó por SELECT simple en cestas y rutas; esto deja **pendiente** un protocolo de control de versiones/locking de cesta y ruta antes de staging.
2. **Segundo fallo: identidad en SECURITY DEFINER.** El contexto `current_setting('role')` identificaba al propietario efectivo de la función, no de forma confiable al gestor autenticado. Se reemplazó por `session_user` y conexiones de laboratorio con identidades independientes.
3. **Tercer fallo: lectura de tarifa bajo RLS.** `SELECT ... FOR SHARE` sobre configuración no encontraba filas para gestores porque también interactuaba con la política UPDATE. Se implementó un bloqueo advisory **transaccional compartido** en cotización y **exclusivo** en actualización administrativa, permitiendo lectura con SELECT simple y manteniendo serialización entre cotización y cambio de tarifa.

Las ejecuciones intermedias fallaron y fueron investigadas. **La ejecución final pasó completa**.

## Límites y riesgos residuales

- El laboratorio simula la autenticación con roles LOGIN y contraseñas ficticias de PostgreSQL desechable; esto **no es** la autenticación de clientes de Supabase ni el modelo de roles real.
- `session_user` es seguro aquí porque el gestor se conecta con una identidad de base de datos distinta. **No es trasladable sin más a un backend con un único rol de conexión o pool compartido.** En esa arquitectura debe verificarse identidad en la capa servidor y pasarla mediante un mecanismo protegido, con políticas y permisos auditados.
- El propietario RPC tiene SELECT/INSERT/UPDATE mínimos necesarios en tablas internas, pero la lógica SQL sigue siendo de laboratorio y la procedencia de ruta es `server_fixture`.
- El bloqueo advisory de tarifa debe ser utilizado por **todos** los escritores autorizados de configuración; una actualización por fuera de la RPC podría eludir la serialización. En integración, impedir escritores alternativos y definir lock ordering.
- El prototipo **no bloquea cambios simultáneos de cesta/ruta** con el mismo nivel de garantía que la tarifa. Antes de staging, añadir CAS/revisión persistente y probar carreras de mutación contra cotización.
- El digest `md5` es sintético y la auditoría no es inmutable. Faltan huellas canónicas fuertes, TTL/estado de idempotencia, evidencias de rutas confiables, RLS real de la arquitectura elegida y pruebas de recuperación multinodo.

**Dictamen:** endurecimiento de permisos y RLS aprobado **solo en PostgreSQL desechable**. **NO-GO para staging** hasta cerrar los riesgos y obtener autorización separada. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
