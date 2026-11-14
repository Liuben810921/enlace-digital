# Laboratorio transaccional PostgreSQL de seis dimensiones — 14-11-2026

## Verificado antes de esta fase
- GitHub Actions [#43631785651](https://github.com/Liuben810921/enlace-digital/actions/runs/43631785651): **success**. Pruebas de concurrencia sintética en memoria aprobadas.

## Implementación
- `tests/postgres-delivery-six-context-races-lab.sql`: esquema aislado `ed_quote_race` en PostgreSQL 16 desechable, versiones para cesta, destino, ruta, almacenes, asociaciones y tarifa; RPC `prepare`, `mutate` y `confirm` con bloqueos de filas y registro de auditoría. Privilegios públicos revocados.
- `tests/postgres-delivery-six-context-races-lab.py`: conexiones independientes y esperas de bloqueo observadas en `pg_stat_activity`; mutación antes de confirmar rechazada, confirmación antes de mutación aceptada, doble confirmación idempotente, cambios por seis dimensiones y aislamiento de dos cestas ficticias.
- `.github/workflows/isolated-delivery-quote.yml`: ejecución en servicio PostgreSQL 16 efímero de GitHub Actions.
- [CI nueva #43631982899](https://github.com/Liuben810921/enlace-digital/actions/runs/43631982899): comprobar resultado definitivo antes de afirmar que las pruebas nuevas pasaron.

## Límites de seguridad
No se implementan cotizaciones comerciales ni se verifican distancias viales: las pruebas solo verifican coherencia de versiones. No se conectan proveedores externos, Supabase, staging, producción, pedidos, clientes, pagos ni correo. El almacén real confirmado en `23.13024, -82.36028` no recibe nombre comercial.

Este esquema desechable es un contrato de prueba, **no** un diseño listo para producción: faltan integración con roles y RLS de Supabase, garantías del servidor, selección de almacenes efectivos y rutas verificadas, pruebas de recuperación y despliegue autorizado.
