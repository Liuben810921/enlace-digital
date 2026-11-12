# F6-B26 — recuperación, reintentos concurrentes y límites de permisos

Fecha: 2026-11-10. PR #3; exclusivamente GitHub y PostgreSQL 17 desechable.

## Alcance y casos
- Recuperación después de COMMIT: reintento desde otra conexión con orden distinto de claves JSON produce REPLAY; un importe distinto da CONFLICT y no modifica la operación registrada.
- Rollback explícito: reserva sintética dentro de BEGIN/ROLLBACK no consume la clave.
- Interrupción abrupta: sesión de cliente abre una transacción, inserta una clave, entra en pg_sleep; una conexión de observación verifica bloqueo de escritura y el proceso cliente es terminado. El siguiente intento desde una conexión nueva debe producir NEW y luego REPLAY.
- Canonicalización: se comprueba que la validación del JSON crudo produce bytes y SHA-256 idénticos para permutaciones de claves y espacios.
- Concurrencia: 16 reintentos simultáneos (8 por identidad) sobre la misma clave. Se exige un NEW y siete REPLAY por identidad, sin cruce de identidades.
- ACL/RLS: roles a, b y stranger no pueden leer ni insertar directamente en tabla; tampoco escalar a owner. Stranger no puede ejecutar la función.

## Restricciones y advertencias
Solo datos inventados en un servicio PostgreSQL efímero del runner. No se prueban caídas del servidor PostgreSQL, WAL, recuperación tras apagado del host, entrega exactamente una vez de efectos externos, JWT ni infraestructura de producción. La terminación del cliente prueba rollback ante pérdida de conexión, no un crash completo del servidor. Los roles son de laboratorio y no equivalen a cuentas reales.

**No-go:** no se fusiona PR, no se despliega, no se accede a Supabase, staging, producción, código operativo, clientes, datos históricos, correo, servicios ni pedidos. Staging y lectura histórica requieren autorizaciones independientes.

**Evidencia CI:** pendiente de ejecución final; registrar resultado después de observar GitHub Actions.
