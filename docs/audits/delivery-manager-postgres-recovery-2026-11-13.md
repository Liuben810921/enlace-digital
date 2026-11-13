# Recuperación transaccional: cancelación, timeouts y deadlocks del cotizador

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **CI:** https://github.com/Liuben810921/enlace-digital/actions/runs/43502939445 — success.

## Archivos y ejecución
- `tests/postgres-delivery-recovery-lab.py`: pruebas con conexiones PostgreSQL 16 reales dentro de un servicio efímero de GitHub Actions.
- `.github/workflows/isolated-delivery-quote.yml`: ejecución automática de la nueva batería después de las anteriores.

## Pruebas verificadas
1. **Cancelación:** se envió `pg_cancel_backend` a una consulta `pg_sleep` en curso dentro de una transacción que había generado una cotización. Se recibió `QueryCanceled`, la transacción quedó abortada y `ROLLBACK` eliminó la operación no confirmada. El reintento confirmó una única fila.
2. **`statement_timeout`:** se fijó un timeout local de 120 ms y se provocó una consulta de 1 s; el error abortó la transacción completa. Se comprobó que no quedaba una cotización parcial y que el reintento era válido.
3. **`lock_timeout`:** una conexión mantuvo bloqueada la configuración; otra intentó cotizar con timeout de 120 ms, recibió `LockNotAvailable`, revirtió y luego recuperó la operación.
4. **Deadlock en cotización:** dos transacciones actualizaron recursos en orden inverso e incluyeron una llamada real al contrato SQL de cotización. Se observó un error 40P01; la transacción perdedora se reintentó desde cero con backoff exponencial acotado. Ambas claves terminaron con una sola fila cada una.
5. **Terminación abrupta:** se terminó un backend con `pg_terminate_backend` antes de confirmar la transacción. PostgreSQL revirtió la operación; el reintento confirmó una única cotización.

## Alcance y limitaciones
Estas pruebas verifican recuperación de **transacciones sintéticas** y no una implementación de pagos o pedidos. El entorno no es Supabase. Los importes son fixtures, no cálculos reales de ruta. No se inyectó un fallo exactamente durante el intercambio de mensajes del protocolo COMMIT; esa condición de resultado desconocido requiere un ensayo específico adicional. La batería no prueba durabilidad ante caída del servidor completo, particiones de red prolongadas, ni un sistema distribuido multinodo.

## Requisitos antes de staging
- Integrar autorización real y cálculo de tarifas exclusivamente en backend.
- Definir políticas de reintento por SQLSTATE, jitter, límites de tiempo y deduplicación persistente.
- Asociar claves de idempotencia a identidad y payload normalizado; garantizar versionado de cesta, destino, almacenes y tarifa.
- Implementar observabilidad y auditoría transaccional sin exponer datos personales.
- Ejecutar una revisión final de seguridad y obtener autorización independiente antes de tocar staging.

**No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.**
