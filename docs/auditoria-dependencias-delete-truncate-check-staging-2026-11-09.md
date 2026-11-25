# Auditoría de dependencias DELETE/TRUNCATE y CHECK NOT VALID — 2026-11-09

## Alcance
Solo lectura sobre staging `xqahthghvozeigbojhyi`, archivos de la rama `audit/registro-staging-aislado-20261109`, catálogos SQL y agregados sin datos personales. No se ejecutaron operaciones de escritura.

## Hallazgos
- Controlador `supabase/functions/enlace-cliente-auth-staging/index.ts`: las únicas operaciones sobre `clientes_destinatarios` y `clientes_direcciones_entrega` son `select`, `insert` y `update`. No hay `delete`, `truncate` ni rutas equivalentes en ese controlador. El adaptador `scripts/staging_customer_web_adapter.mjs` tampoco contiene operaciones de borrado.
- En las funciones SQL de `public` y `enlace_auth` se buscaron referencias en `pg_proc.prosrc` a ambas tablas: **cero coincidencias**. Los triggers no internos de `clientes_oficiales`, `clientes_destinatarios` y `clientes_direcciones_entrega`: **cero**. Esta búsqueda no incluye consumidores externos, SQL dinámico, jobs de otras plataformas ni código de producción.
- ACL de ambas tablas: `postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres`. `service_role` tiene privilegios efectivos `DELETE=true` y `TRUNCATE=true` en ambas. El esquema v4 solo documenta `GRANT SELECT,INSERT,UPDATE`; conceder esos tres no revoca permisos existentes.
- Propuesta separada y **no ejecutable**: `sql/propuestas/staging_minimo_privilegio_destinatarios_no_ejecutar.sql`. Contiene exclusivamente comentarios, incluidos REVOKE y GRANT para reversión, para impedir aplicación accidental. No se recomienda ejecutar hasta inventariar consumidores y obtener aprobación específica.
- Restricción `public.ed_cliente_cuba_direccion_ck`: `convalidated=false`, condición: residencia distinta de cuba o provincia/municipio presentes y dirección de longitud >=8. Consulta agregada `clientes_oficiales`: total 0, Cuba 0, incumplimientos 0. En el estado actual, no hay datos históricos que impidan su validación; **no se ejecutó VALIDATE CONSTRAINT**.
- La tabla `clientes_destinatarios` tiene FK validada con `ON DELETE CASCADE` hacia `clientes_oficiales`; lo mismo `clientes_direcciones_entrega`. Revocar DELETE en las tablas hijas no es equivalente a eliminar la cascada y no garantiza evitar borrados por operaciones privilegiadas sobre la tabla padre.
- RLS habilitado sin políticas en las seis tablas examinadas; roles `anon` y `authenticated` sin acceso directo. `service_role` sigue siendo privilegiado y puede operar por vías distintas de la función Edge.

## Riesgos y reversión
- Antes de cualquier REVOKE: confirmar que no existen otras integraciones con `service_role` que requieran borrado, y evaluar si el permiso efectivo proviene de otros grants o membresías. El REVOKE podría afectar operaciones administrativas ajenas al controlador.
- La reversión documentada vuelve a conceder únicamente DELETE y TRUNCATE a `service_role`, pero requiere autorización separada; verificar grants efectivos después de cualquier modificación.
- La futura validación de CHECK puede requerir bloqueo/escaneo y nuevas comprobaciones de filas; repetir el conteo antes de una ventana autorizada. El resultado cero es una fotografía temporal.
- Ninguna propuesta constituye aprobación para desplegar Edge, ejecutar SQL, activar registro, correo o pedidos.

Fuentes: PostgreSQL REVOKE https://www.postgresql.org/docs/17/sql-revoke.html ; Supabase RLS https://supabase.com/docs/guides/database/postgres/row-level-security .
