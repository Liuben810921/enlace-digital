# Geoapify — ciclo de vida offline de reservas, 2026-11-20

Base `5120837c76b0e741cc64feaa2032df1bc1548fef`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`; comparación inicial `identical`.

## Cambios funcionales
- `postgres-disposable/005_geoapify_lifecycle.sql`: estados RESERVED, DISPATCHED, CONSUMED, FAILED_CHARGED, RELEASED y REVIEW_REQUIRED; eventos únicos por token; transiciones bajo advisory lock transaccional; liberación de crédito diario únicamente antes de despacho; marcado de huérfanas para revisión, sin devolución automática. Un fallo posterior al despacho permanece cargado de forma conservadora.
- `postgres-disposable/006_geoapify_lifecycle_tests.sql`: pruebas con ROLLBACK para despacho, replay, token en conflicto, prohibición de refund tras despacho, consumo, terminalidad, devolución predespacho una vez y bloqueo de despacho tras liberación.
- `postgres-disposable/run_concurrency.py`: carga 001,003,005 y ejecuta 002,004,006 antes de la prueba de dos sesiones.

## Verificación realmente disponible
- GitHub: base y rama comparadas antes de editar, sin commits posteriores.
- Entorno local: `command -v psql` no devolvió ejecutable. **No se ejecutaron SQL ni carreras reales**, y no se intentó instalar PostgreSQL.
- No se afirma que la conciliación haya sido probada en un servidor.

## Límites de seguridad importantes
1. El estado CONSUMED refleja un evento confiable de backend, **no** verificación real de consumo del proveedor; no existe todavía integración Geoapify.
2. El estado FAILED_CHARGED retiene créditos ante fallo tras despacho; el sistema no deduce automáticamente si el proveedor facturó.
3. La liberación antes de despacho devuelve créditos del presupuesto diario, pero mantiene el consumo del límite por minuto para no abrir una vía de ráfagas. No hay liberación después del despacho.
4. Las reservas huérfanas pasan a REVIEW_REQUIRED y no se reembolsan automáticamente. Las reservas marcadas antes de despacho también quedan conservadoramente retenidas, a la espera de conciliación manual.
5. La RPC `reserve` sigue devolviendo REPLAY para una operación liberada: el llamador debe consultar el estado antes de despachar. No conectar a proveedor hasta reforzar ese contrato.
6. Falta verificar privilegios mínimos reales, aislamiento de identidad, prueba de saturación concurrente y resultados de commit desconocido con PostgreSQL real.
7. El adaptador de autenticación y ledger de la Edge Function continúa sin conectar. Estado operativo PENDIENTE.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
