# Geoapify — registro transaccional PostgreSQL desechable (2026-11-20)

Base `72da09d58bdb3394a05927fd15b3e3420c2fef14`, comparación inicial `identical`. Rama aislada conservada.

## Entregables
- `experiments/havana-delivery-quote/postgres-disposable/001_geoapify_ledger.sql`: esquema separado, presupuesto diario con `CHECK`, reservas únicas por `(principal,operation_id)`, RPC SECURITY INVOKER con bloqueo `FOR UPDATE`, débito y reserva en una transacción, replay idempotente, rechazo de conflicto, función de consulta tras commit incierto y permisos PUBLIC revocados.
- `002_geoapify_ledger_tests.sql`: transacción con ROLLBACK y aserciones para reserva, replay, conflicto de hash, débito único, consulta, créditos fuera de rango y día obsoleto; protocolo de dos sesiones y desconexión tras COMMIT.

## Ejecución y límites honestos

Se comprobó en el entorno local que no existen binarios `postgres`, `initdb`, `pg_ctl`, `psql` ni Docker, y que no están instalados `psycopg` ni `pglast`. **No se ejecutó PostgreSQL real ni pruebas de concurrencia**, y por tanto no se afirma PASS de SQL. No se descargaron ni instalaron servicios. Las pruebas son reproducibles en un PostgreSQL desechable autorizado posteriormente.

## Riesgos abiertos antes de conectar la Edge Function

1. Validar y ejecutar SQL en PostgreSQL local real; comprobar bloqueo de dos sesiones, deadlocks, transacción abortada, cancelación y commit desconocido.
2. La reserva usa `now()` en UTC y fecha actual: un reintento al día siguiente se rechaza; definir semántica de conciliación multidiaria y expiración antes de producción.
3. El prototipo presupone que el caller calcula correctamente un SHA-256 canónico y autentica `principal`. No enlazarlo a entrada pública sin autorización de servidor y privilegios mínimos.
4. No existe aún control transaccional de cuota por minuto, liquidación de créditos efectivamente consumidos, recuperación de reservas huérfanas ni protección de reintentos externos a Geoapify.
5. `reserveAtomic` del gateway ESM todavía no está conectado a esta RPC, y el estado sigue PENDIENTE.
6. Las pruebas de dos sesiones son instrucciones para ejecución futura, no evidencia ejecutada.

Sin Supabase, claves, llamadas Geoapify, GitHub Actions, staging, producción, pedidos reales, despliegues ni costos.
