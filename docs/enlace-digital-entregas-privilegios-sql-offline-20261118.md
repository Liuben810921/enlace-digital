# ENLACE DIGITAL — revisión de privilegios SQL offline
Fecha 2026-11-18; base `df777e34f75635a57ea2391771823a7817a280e1`; comparación inicial `identical`.

## Cambios publicados
- `manual_approval_rpc.sql`: propietario `ed_delivery_lab_owner` para tres funciones `SECURITY DEFINER`, con `USAGE` de esquema, lectura explícita de tablas, escritura únicamente en aprobaciones y acceso a secuencia. `ed_delivery_lab_api` conserva solo `EXECUTE`, sin acceso directo a tablas ni `CREATE` de esquema. Eliminados comentarios con secuencias literales `\\n` heredadas.
- `roles_preflight.sql`: roles técnicos `NOLOGIN NOBYPASSRLS`, para DBA de base desechable.
- `identity_models.md`: diferencias entre logins PostgreSQL individuales y pool compartido. El pool compartido NO identifica al administrador con `session_user`.
- `adversarial_roles_check.js`: 13 aserciones estáticas preparadas, NO ejecutadas en PostgreSQL.

## Riesgos restantes
1. SQL **no ejecutado ni compilado**: no hay PostgreSQL local. No afirmar permisos, RLS, transacciones ni concurrencia probados.
2. La transferencia de propiedad `ALTER FUNCTION ... OWNER TO` requiere un DBA autorizado y permisos efectivos; puede fallar en un entorno real. `roles_preflight.sql` no concede credenciales ni crea logins de clientes.
3. `SECURITY DEFINER` y esquema cerrado requieren auditoría del propietario real, búsqueda de objetos, herencia de roles y privilegios predeterminados antes de usarlo.
4. El modelo de pool compartido necesita gateway autenticado y una vinculación verificable de la identidad al contexto transaccional; no existe aún. No introducir GUC manipulables ni aceptar actor desde navegador.
5. La huella de `context_state` continúa sintética y no derivada de datos empresariales autorizados.
6. No hay garantías de revocación concurrente ni de persistencia sin ejecutar PostgreSQL.

**Resultado operativo:** siempre `PENDIENTE` para cestas mixtas especiales, sin afectar checkout.

No se usaron GitHub Actions, Supabase, staging, producción, pedidos, descargas, despliegues, cartografía ni costos.
