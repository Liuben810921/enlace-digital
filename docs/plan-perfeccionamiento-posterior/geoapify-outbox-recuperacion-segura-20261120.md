# ENLACE DIGITAL — recuperación segura del outbox, 2026-11-20

Base `c2d21ec4f895c96950ac3786b6bde644aa3385cf`, rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: `identical`.

## Defecto comprobado en código fuente
La lectura directa de `013_geoapify_dispatch_outbox.sql` desde GitHub mostró corrupción textual: fragmentos duplicados tras COMMIT, expresiones regulares sin cerrar y validaciones de token malformadas. Ese archivo no puede considerarse una migración ejecutable. Se intentaron correcciones, pero las lecturas posteriores seguían mostrando texto inconsistente. Se creó `015_geoapify_outbox_clean.sql` como **reemplazo íntegro**, y `run_concurrency.py` ahora apunta a 015 en lugar de 013. No aplicar 013.

## Contrato de recuperación
- Autorización de despacho y creación de outbox en una sola transacción.
- Reclamar READY una única vez; CLAIMED/UNKNOWN nunca habilitan otro envío.
- Resultado ambiguo UNKNOWN: no reintentar automáticamente, conservar reclamación y esperar evidencia de conciliación.
- Resultado confirmado: SUCCEEDED o FAILED_CHARGED, con token de reclamación original y transición conservadora del ledger.
- Repetición de confirmación terminal: rechazo sin doble contabilización.
- No existe worker ni envío real.

## Pruebas
- Se consultaron directamente archivos GitHub y se verificó el commit base.
- `014_geoapify_dispatch_outbox_tests.sql` contiene pruebas adversariales rollback de doble autorización, doble claim, token incorrecto, UNKNOWN, bloqueo de reintento y conciliación.
- **No se ejecutaron pruebas SQL ni PostgreSQL**. No se instaló PostgreSQL.
- **No se ejecutaron pruebas Node.js**; el cambio es SQL/Python, y no se materializaron copias exactas Node.
- La sintaxis de 015 no se ha validado con un motor PostgreSQL. La sustitución de 013 por 015 en el runner es verificable en GitHub, no una prueba SQL aprobada.

## Riesgos pendientes
1. El estado CLAIMED puede representar envío no realizado o realizado: no se permite reenviar por mera caducidad.
2. El estado UNKNOWN requiere reconciliación con evidencia confiable del proveedor. No se consultó Geoapify.
3. No se garantiza exactamente una entrega; se prioriza evitar duplicados.
4. Revisar permisos mínimos y accesos directos a tablas antes de habilitar cualquier adaptador.
5. Antes de cualquier uso real, ejecutar 015/014 y concurrencia en PostgreSQL desechable, con autorización específica.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
