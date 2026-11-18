# ENLACE DIGITAL — Entregas: contrato SQL offline, 18 noviembre 2026

Base `802544baf06645619ad5182c2e43cb5e4cdaf777`, rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: identical.

## Disponibilidad y alcance real
Se comprobó localmente `command -v postgres`, `initdb`, `psql`, `pg_ctl` y rutas PostgreSQL habituales: **no disponibles**. No se instaló software, descargaron binarios ni conectaron servicios. No fue posible crear PostgreSQL desechable ni verificar carreras transaccionales, RLS, permisos reales, persistencia tras reconexión o durabilidad.

## Archivos publicados
- `experiments/havana-delivery-quote/postgres-lab/manual_approval.sql`: SHA Git `cb5c92412de8fe7a5cdc17ed3b7d97728e1cc52b`, coincide con archivo local.
- `experiments/havana-delivery-quote/postgres-lab/validate_sql.js`: SHA Git `718ba06880539f6c4c780fb5fe33b9437d64e338`, coincide con archivo local.
- `experiments/havana-delivery-quote/postgres-lab/transaction_scenarios.md`: SHA Git `4fbb2b463a74c9441c0b8acf4939a3d5738f7576`. Documento de escenarios, no pruebas ejecutadas.

```sh
node experiments/havana-delivery-quote/postgres-lab/validate_sql.js
# PASS 16 SQL contract static checks (NOT PostgreSQL execution)
```

## Diseño SQL, alcance preciso
DDL mínimo de `configuration` y `approvals`, restricciones de revisión, fingerprint, importe, vencimiento, revocación, unicidad `(actor_id,operation_id)`, índice de aprobaciones activas y revocación de permisos a `PUBLIC`. El archivo **no contiene funciones RPC ni implementación transaccional completa**, y no concede roles operativos. El flujo de autenticación, bloqueo `FOR UPDATE`, comparación de reintentos y consulta de vigencia se documenta en comentarios como **requisitos pendientes**. No se ha probado que el SQL sea válido ante PostgreSQL real.

## Bloqueantes
1. PostgreSQL local no disponible: no se pudieron probar bloqueos concurrentes, conflictos, persistencia tras reconexión o aislamiento.
2. Falta implementar funciones RPC transaccionales y control real de roles en servidor; no se deben aceptar roles ni huellas desde el cliente.
3. La opción C requiere revalidación atómica de cesta, destino, almacenes, revisión y revocación al confirmar; ninguna cotización sintética puede cobrarse.
4. Para ejecución real se necesitaría entorno PostgreSQL desechable autorizado y aislado, sin datos empresariales ni acceso a Supabase. Staging y producción requieren autorización separada.

No se modificaron checkout operativo, GitHub Actions, Supabase, staging, producción, pedidos reales, cartografía ni despliegues; sin costos.
