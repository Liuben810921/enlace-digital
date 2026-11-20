# Geoapify — cuotas por minuto, saturación e idempotencia (2026-11-20)

Rama aislada `plan/havana-osrm-benchmark-offline-20261114`; base `0744d7a041f7fc1811791c5246ab66f53ffbff9a`, comparación inicial `identical`.

## Archivos
- `postgres-disposable/003_geoapify_minute_budget.sql`: tabla de cuota por minuto UTC y reemplazo de `reserve`; bloqueo advisory transaccional compartido para serializar operaciones; chequeos diario y por minuto; débito de ambos presupuestos y registro de reserva dentro de la misma transacción; replay idempotente comprobado antes del chequeo de día, para no duplicar créditos tras medianoche. Sigue siendo prototipo de PostgreSQL desechable.
- `postgres-disposable/004_geoapify_quota_tests.sql`: aserciones con ROLLBACK para replay entre fechas, conflicto de payload, límite de minuto, saturación diaria, ausencia de débito en fallos y consulta de reserva para recuperación tras commit incierto.
- `postgres-disposable/run_concurrency.py`: ampliado para cargar 001 → 003 → 002 → 004 antes de las pruebas de dos sesiones.

## Verificación realizada y límites
Se revisó la rama mediante conector GitHub antes de editar. Se comprobó localmente que `psql` y `postgres` no están disponibles, sin repetir instalación. **No se ejecutó SQL, ni concurrencia real, ni simulaciones que pretendan demostrar atomicidad**. Las pruebas SQL quedaron preparadas para un PostgreSQL local desechable autorizado.

## Riesgos y tareas abiertas
- El bloqueo advisory global serializa el prototipo pero limita escalabilidad; verificar rendimiento, carreras reales y comportamiento bajo 2400 créditos y 30 créditos/minuto en PostgreSQL real.
- La cuota por minuto es una ventana fija UTC, no una ventana móvil ni un límite de solicitudes por segundo. Se debe agregar protección por segundo y cuota real de proveedor antes de conectar Geoapify.
- El esquema todavía carece de un ciclo completo de conciliación de reservas con créditos realmente consumidos y de una política de recuperación de reserva huérfana.
- El caso de commit desconocido está preparado mediante `lookup`, pero **no se reprodujo una desconexión real tras COMMIT**. No emitir nueva operación automáticamente.
- El control de `principal`, el hash canónico del payload y el rol de ejecución con privilegios mínimos requieren implementación y pruebas adicionales.
- No conectar el gateway ESM a la RPC hasta validar autenticación y concurrencia real.
- `002_geoapify_ledger_tests.sql` utiliza `d-1` y espera INVALID_INPUT para una operación nueva; el nuevo `reserve` conserva ese rechazo.

**Estado:** `PENDIENTE`. Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
