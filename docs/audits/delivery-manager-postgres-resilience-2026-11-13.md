# Laboratorio de resistencia PostgreSQL: deadlocks, backoff y cambios concurrentes

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **GitHub Actions aprobado:** https://github.com/Liuben810921/enlace-digital/actions/runs/43502640929

## Implementación
Se amplió `tests/postgres-delivery-quote-lab.sql` con versiones sintéticas de dirección y almacén, un contrato `quote_bound` que exige versiones vigentes y tablas para inducir deadlocks. Se creó `tests/postgres-delivery-resilience-lab.py` para ejecutar sesiones PostgreSQL reales en paralelo y se añadió al workflow aislado `isolated-delivery-quote.yml` usando psycopg 3.

## Resultados verificados
- **Deadlock real:** dos transacciones adquirieron bloqueos de tablas en orden inverso; una terminó con SQLSTATE 40P01 y la otra confirmó.
- **Reintentos con backoff:** cliente de prueba reintenta errores 40001/40P01 con límite de intentos y espera exponencial; las versiones definitivamente obsoletas no se aceptan. La batería fuerza reintentos por versión obsoleta, pero no fuerza un segundo deadlock dentro del mismo cotizador.
- **Dirección, almacén y tarifas concurrentes:** una cotización vinculada a versiones compitió con tres cambios simultáneos; se verificó que las tres actualizaciones persistieran y que posteriores cotizaciones con versiones antiguas fueran rechazadas.
- **Conexión perdida tras commit:** el cliente inició una transacción, confirmó la operación y se interrumpió su conexión durante una sentencia posterior de espera. Se verificó la persistencia de una sola fila y el replay idempotente. **No se forzó la pérdida de conexión exactamente dentro de la operación COMMIT**, por lo que la prueba demuestra recuperación de una respuesta interrumpida después del commit, no todos los casos de resultado de commit verdaderamente indeterminado.
- **CI:** la ejecución inicial del esquema ampliado detectó un error de delimitación de la función PL/pgSQL; se corrigió el cuerpo dollar-quoted y la ejecución final pasó.

## Limitaciones y requisitos antes de staging
1. El entorno PostgreSQL es efímero y utiliza solo fixtures; no es Supabase ni una base operativa.
2. Las versiones de dirección y almacén son contadores ficticios; la integración real deberá obtener direcciones, rutas y despachos de fuentes de servidor verificadas.
3. El modelo de prueba permite recibir el importe como parámetro; en producción deberá calcularse en servidor a partir de cesta y reglas vigentes.
4. Para cerrar resiliencia falta probar corte de conexión durante COMMIT con inyección controlada de fallos, reintentos tras deadlocks dentro de una operación de cotización, cancelación y timeout de transacciones, y carreras de actualización con más de un nodo.
5. Antes de staging: permisos reales, persistencia de claves de idempotencia, caducidad y política de recuperación, auditoría transaccional, privacidad de datos y aprobación independiente.

**No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.**
