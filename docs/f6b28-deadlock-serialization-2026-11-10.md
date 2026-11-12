# F6-B28 — SQLSTATE 40P01/40001, tiempos y aislamiento

Fecha: 2026-11-10. PR #3. Solo GitHub Actions y PostgreSQL 17 desechable.

## Matriz
- **40P01**: dos transacciones actualizan dos filas sintéticas en orden inverso; se espera una víctima de deadlock, otra confirmada. La víctima se reintenta desde BEGIN y el valor final confirma exactamente dos transacciones confirmadas, sin escrituras parciales.
- **40001**: dos transacciones SERIALIZABLE leen y actualizan la misma fila; una falla con serialización, la otra confirma. Se reintenta la transacción completa y se comprueba el resultado.
- **57014**: `statement_timeout` aborta una consulta lenta sin registrar operaciones.
- **55P03**: `lock_timeout` falla al esperar un bloqueo sintético, sin alterar la fila; después del rollback del titular se comprueba su valor.
- Canonicalización: JSON con orden de claves y espacios distintos conserva los mismos bytes y SHA-256 del contrato.
- Idempotencia e identidad: 16 solicitudes concurrentes, ocho por identidad, con la misma clave; exactamente un NEW y siete REPLAY por identidad. Payload incompatible devuelve CONFLICT sin alterar el resultado.
- ACL/RLS: roles restringidos no pueden leer ni actualizar tabla, ni asumir rol propietario; ENABLE/FORCE RLS verificados.

## Precauciones
SQLSTATE se verifica en errores verbosos del cliente psql. Las simulaciones son deterministas por contención y temporización controlada, pero el planificador puede variar; un fallo de sincronización debe investigarse y no ocultarse con reintentos arbitrarios del CI. El prototipo no implementa una política real de backoff, jitter, presupuesto de reintentos, efecto externo exactamente una vez, recuperación WAL ni servicios HTTP.

No hay acceso ni cambios a Supabase, staging, producción, código operativo, datos históricos, clientes, correo, pedidos o servicios. PR #3 sigue en borrador, sin merge ni despliegue. Staging y lectura histórica requieren autorizaciones independientes.

CI F6-B28: pendiente de comprobación definitiva.
