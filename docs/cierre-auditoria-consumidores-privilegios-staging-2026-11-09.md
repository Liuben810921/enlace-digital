# Cierre auditoría de privilegios y consumidores conocidos — 2026-11-09

## Alcance
Solo lectura en Supabase staging `xqahthghvozeigbojhyi` y archivos de la rama `audit/registro-staging-aislado-20261109`. Sin SQL de modificación, migraciones, funciones invocadas, despliegues ni cambios de producción.

## Evidencia directa
1. `pg_roles`: `service_role` tiene `rolbypassrls=true`, no es superusuario. `postgres` también tiene `rolbypassrls=true`. `anon` y `authenticated` tienen `rolbypassrls=false`.
2. `pg_auth_members`: cero membresías cuyo miembro sea `service_role`, `anon` o `authenticated` en la consulta realizada. Los permisos extra no proceden de esas membresías.
3. `aclexplode(relacl)`: ambas tablas tienen concesiones directas de `postgres` a `service_role` para SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER y MAINTAIN; ningún `is_grantable` en las filas consultadas. El borrador SQL v4 solo requiere SELECT, INSERT y UPDATE. El esquema ya cuenta con secuencias identity concedidas por separado.
4. Tablas/vistas en esquemas `public` y `enlace_auth` con nombre relacionado con destinatarios/direcciones: solo las dos tablas objetivo, ambas con RLS habilitado. No se hallaron FK de otras tablas que apunten hacia ellas. Sí existen FK desde ambas hacia `clientes_oficiales` con `ON DELETE CASCADE`, por lo que revocar DELETE a `service_role` en las tablas hijas no impide cascadas realizadas por otras rutas privilegiadas.
5. Auditoría previa del controlador Edge: usa SELECT, INSERT y UPDATE, no DELETE/TRUNCATE. Búsqueda previa de cuerpos de funciones `public` y `enlace_auth`: sin referencias a las dos tablas. No hay triggers no internos en las tres tablas principales revisadas.
6. La propuesta anterior `sql/propuestas/staging_minimo_privilegio_destinatarios_no_ejecutar.sql` se amplió para contemplar también REFERENCES, TRIGGER y MAINTAIN. **Todo el SQL de esa propuesta está comentado**. No debe ejecutarse sin inventario externo y aprobación separada.

## Limitaciones y decisión
Los catálogos de la base de datos y los archivos revisados **no permiten probar la ausencia de consumidores externos** que usen la misma clave `service_role`, ni detectar SQL dinámico en otros sistemas, jobs externos o accesos de administradores. La reducción de permisos es coherente con el controlador staging, pero **no puede declararse segura para todos los consumidores** sin inventario operativo y pruebas autorizadas.

Antes de aplicar: verificar consumidores externos, confirmar privilegios vigentes, obtener copia del ACL, aprobar una ventana staging, probar rutas autorizadas de registro, sesión y destinatarios, y preparar reversión exacta de los grants originales. RLS no protege contra un rol con BYPASSRLS; mantener la clave de servicio solo en servidor. No modificar producción.

## Estado
Auditoría read-only terminada; propuesta inerte preparada. Cambios de permisos, validación de CHECK, despliegue y activación NO autorizados.
