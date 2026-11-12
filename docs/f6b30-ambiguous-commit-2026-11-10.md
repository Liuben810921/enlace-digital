# F6-B30 — confirmación ambigua de COMMIT y reconciliación

Fecha: 2026-11-10. PR #3, PostgreSQL 17 efímero y GitHub Actions.

## Pruebas
- **Antes de COMMIT**: una transacción crea una reserva y permanece abierta; el observador verifica bloqueo de escritura y termina el backend del fixture. El siguiente intento debe dar NEW y luego REPLAY: la reserva no confirmada se revierte.
- **Después de COMMIT, antes de la confirmación del cliente**: una transacción confirma la reserva y entra en espera. Una segunda sesión verifica REPLAY antes de finalizar el backend inicial. Tras la interrupción, REPLAY sigue siendo estable, mientras otro payload produce CONFLICT.
- **Identidad**: la misma clave para un segundo rol sintético debe producir NEW independiente; conflictos posteriores no modifican reservas existentes.
- **Concurrencia**: 16 reconciliaciones simultáneas, ocho por identidad, con un NEW y siete REPLAY por identidad.
- **ACL**: sin lectura directa de tabla para roles restringidos; stranger no puede ejecutar la reserva.

## Criterio de cierre
El caso de confirmación desconocida debe resolverse consultando/reintentando la **misma clave idempotente** con **la misma identidad y payload**, nunca creando una nueva clave para el mismo efecto. Un resultado CONFLICT exige intervención, no reintento ciego. La fase solo prueba el contrato sintético de reserva y no pagos, inventario, mensajes ni efectos externos.

## Límites y prohibiciones
La simulación termina el backend PostgreSQL de laboratorio; no corta realmente una respuesta HTTP ni demuestra exactamente una vez frente a servicios externos. No se prueba durabilidad ante pérdida de disco, failover o recuperación WAL. Sin Supabase, staging, producción, código operativo, clientes, históricos, correos, servicios ni pedidos. PR #3 sigue borrador; staging e históricos requieren autorizaciones independientes.

CI: pendiente de validación final.
