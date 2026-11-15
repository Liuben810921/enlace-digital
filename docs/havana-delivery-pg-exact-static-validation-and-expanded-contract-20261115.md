# Contrato ampliado de concurrencia PostgreSQL — diseño exclusivamente offline

Base verificada: `85d87fd1447cade79f999bfc838d3dcf876209b7`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Estado y evidencia

Los bytes exactos publicados de `pg_transaction_scenarios_offline.json` y `test_pg_transaction_scenarios_static.py` fueron reconstruidos localmente y cotejados con sus blobs Git:

| Archivo | Git blob coincidente | SHA-256 local |
|---|---|---|
| pg_transaction_scenarios_offline.json | `4db2c36c5d33fa8bca7a26f2f68f8ff49156fb1c` | `fd0270548f05b1a1772941e83ded7d8a2d28769f8d779e470fb59c5fa33ace2e` |
| test_pg_transaction_scenarios_static.py | `1528910d27ac50c5e8c8ac5917d6241b16e5a6e5` | `0782e2257d96756eec65a151cd0c60aaa176c93b5a266bcee14aab7cde6df139` |

Comandos realmente ejecutados en `/mnt/data/ed_pg_exact`:

```sh
git hash-object pg_transaction_scenarios_offline.json test_pg_transaction_scenarios_static.py
sha256sum pg_transaction_scenarios_offline.json test_pg_transaction_scenarios_static.py
python -m unittest -q test_pg_transaction_scenarios_static
python -O -m unittest -q test_pg_transaction_scenarios_static
```

Resultado observado: **12/12 OK** normal y **12/12 OK** con `-O`. No se modificaron los dos archivos.

## Modelo transaccional propuesto (NO implementado ni ejecutado)

Identidad sintética: `tenant_id`, `basket_id`, `quote_id`, `operation_id`. Vector de versiones: `basket_v,address_v,routes_v,warehouses_v` como enteros no negativos de 64 bits con rechazo de desbordamiento. La cotización captura el vector y el hash canónico del payload, almacén participante, distancia y tarifa sintética. Estado inicial y cambios de cesta, dirección, rutas y almacenes deben persistirse junto al incremento de su versión en una misma transacción.

**Invariante de commit:** una cotización solo puede registrarse si el vector capturado coincide con el vector vigente bajo protección transaccional; la comprobación aislada antes de insertar es insuficiente. Se propone bloquear la fila de versiones con `SELECT ... FOR UPDATE` hasta confirmar, o un CAS `UPDATE ... WHERE versions=expected RETURNING` que fuerce conflicto observable; cada escritor de dimensiones debe usar el mismo mecanismo de coordinación. Comprobar filas afectadas exactamente una, o rechazar.

**Idempotencia:** clave única por `(tenant_id,operation_id)`; guardar hash canónico del payload, resultado y estado terminal en la misma transacción. Mismo par clave/payload devuelve el resultado previo sin nueva reserva; clave repetida con distinto payload produce conflicto; reintento tras pérdida de conexión consulta primero el resultado persistido. No reutilizar claves caducadas sin política explícita y ensayo de colisión/retención.

**RLS:** `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY` en tablas sintéticas; roles de aplicación sin `BYPASSRLS`, sin propiedad privilegiada de las RPC y con `GRANT` mínimo. Probar `SELECT`, `INSERT`, `UPDATE`, `DELETE` cruzados y `WITH CHECK`, incluyendo funciones `SECURITY DEFINER` y `search_path` fijado. El contexto del inquilino debe derivar de identidad autenticada confiable, nunca de un identificador libremente enviado por el cliente.

## Intercalaciones con dos conexiones

- **T1 lectura / T2 cambio / T1 commit:** repetir individualmente para cesta, dirección, rutas y almacenes; exigir rechazo del vector obsoleto. También probar T2 bloqueado hasta finalizar T1 cuando se emplee bloqueo de fila.
- **Dos escritores CAS:** ambos leen v0, solo uno confirma v1; el otro debe recibir conflicto y obtener nuevo snapshot.
- **Reintentos:** mismo `operation_id` y payload simultáneos producen una sola cotización persistida; payload distinto no reutiliza resultado.
- **SERIALIZABLE:** cuando surja SQLSTATE `40001`, abortar toda la transacción y reintentar desde lectura inicial con presupuesto acotado y backoff; no exigir que PostgreSQL produzca siempre `40001` en cualquier planificación.
- **Deadlock:** forzar orden de bloqueos invertido en dos conexiones; ante `40P01`, rollback completo y reintento controlado, sin dejar escrituras parciales.
- **Commit desconocido:** cortar conexión después de enviar COMMIT sin recibir respuesta; la recuperación por idempotencia debe distinguir confirmado, no confirmado e indeterminado, evitando duplicados.
- **RLS adversarial:** T1 con identidad sintética A intenta leer y modificar recursos B, tanto mediante SQL directo como RPC; todas las operaciones deben quedar denegadas y auditadas.
- **Invalidación de cotización:** cambiar stock o ruta entre cálculo y confirmación; no aprobar tarifa antigua ni reserva basada en inventario obsoleto.

## Matriz de criterios de aceptación

| Dimensión | Condición necesaria |
|---|---|
| Atomicidad | Sin reserva, tarifa o clave idempotente parcial tras rollback |
| Aislamiento | Ninguna cotización vigente con vector obsoleto |
| Autorización | Cero accesos cruzados mediante RLS o RPC |
| Idempotencia | Una operación lógica produce un solo resultado persistido |
| Recuperación | Manejo explícito de 40001, 40P01 y commit desconocido |
| Seguridad comercial | `commercial_quote_enabled=false` y `commercial_approval=false` en todo ensayo |
| Reproducibilidad | Barreras T1/T2, trazas y SQLSTATE registrados; datos enteramente sintéticos |

## Bloqueantes y alcance

No existe todavía un banco PostgreSQL autorizado, un ejecutor de dos conexiones ni un esquema SQL probado para esta especificación. Por tanto **no se afirman resultados de transacciones, RLS real ni concurrencia multiproceso**. Las 12 pruebas verificadas son exclusivamente estáticas sobre la matriz JSON.

Para cualquier ejecución futura: autorización independiente, revisión previa de recursos/costos y garantía de entorno desechable sin datos empresariales.

No se ejecutaron PostgreSQL, Actions, OSRM ni descargas; no se tocó Supabase, staging, producción, código operativo o workflows.
