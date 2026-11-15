# Diseño de concurrencia transaccional — solo offline

Base: `cb1b8f935266b4934ab9b7ba93a786627eb5c946`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Artefactos publicados

- `experiments/havana-osrm-portable/pg_transaction_scenarios_offline.json`: 11 escenarios de intercalaciones, Git blob `4db2c36c5d33fa8bca7a26f2f68f8ff49156fb1c`.
- `experiments/havana-osrm-portable/test_pg_transaction_scenarios_static.py`: 12 aserciones estáticas, Git blob `1528910d27ac50c5e8c8ac5917d6241b16e5a6e5`.
- Ambos archivos fueron recuperados tras su publicación y se verificaron los identificadores Git devueltos por el conector.

## Matriz

Cuatro escenarios rechazan cotizaciones obsoletas por cambios de cesta, dirección, rutas o almacenes. Los siete restantes especifican doble escritor CAS, reintento idempotente, conflicto de payload con misma clave, aislamiento entre inquilinos RLS, conflicto de serialización `40001`, deadlock `40P01` y commit de resultado desconocido.

**Invariantes obligatorias:** ninguna cotización comercial habilitada; la versión de cada dimensión debe coincidir en el instante de persistir; el mismo identificador idempotente y payload produce un único resultado; distinto payload con la misma clave se rechaza; RLS no permite lectura cruzada; un error transaccional no deja reserva parcial. El cobro sintético sigue usando el almacén participante más lejano y mínimo facturable de 3 km, conforme al prototipo ya verificado.

## Plan reproducible para PostgreSQL desechable — NO ejecutado

1. Usar exclusivamente un PostgreSQL efímero y datos inventados, sin conexiones a servicios de ENLACE DIGITAL. Crear roles técnicos sin `BYPASSRLS`, sin superusuario y sin permisos de escritura fuera del esquema temporal.
2. Modelar `quote_versions(tenant_id, basket_v, address_v, routes_v, warehouses_v)`, `synthetic_stock`, `synthetic_quotes` y `idempotency_keys` con unicidad por inquilino y operación. Añadir checks, RLS y auditoría.
3. Implementar cotización mediante transacción con bloqueo de la fila de versiones o actualización CAS condicional; guardar el vector exacto usado. Las modificaciones de las cuatro dimensiones deben incrementar la versión en la misma transacción que su cambio.
4. Orquestar dos conexiones con barreras explícitas, registrar el orden real de commits y repetir cada escenario con `READ COMMITTED` y `SERIALIZABLE`. Evitar asumir que `40001` o `40P01` ocurren siempre: solo exigir manejo correcto cuando se producen.
5. Verificar rollback, ausencia de escrituras parciales, permisos mínimos y RLS efectiva dentro de funciones SECURITY DEFINER. Evitar funciones propiedad de roles privilegiados.
6. Para commit desconocido, consultar la clave idempotente antes de repetir; aplicar reintentos acotados con backoff y preservar trazas sintéticas.
7. Finalizar con destrucción del esquema/instancia efímera y evidencia de limpieza. No ejecutar esta fase sin autorización separada y confirmación de recursos/costos.

## Evidencia y limitaciones

En un entorno local se creó una matriz conceptual alternativa `transaction_matrix.json` con 11 escenarios y su validador: **12/12 pruebas estáticas correctas tanto en Python normal como en `-O`**, JSON sintácticamente válido, hashes locales calculados. Esa matriz alternativa no es byte a byte idéntica a los archivos publicados en GitHub.

**No se ejecutaron los 12 tests del archivo publicado `test_pg_transaction_scenarios_static.py` contra el JSON exacto publicado**; la comprobación disponible de esos archivos es lectura posterior de GitHub y sus blobs. Antes de afirmar regresión exacta, reproducir:

```sh
cd experiments/havana-osrm-portable
python -m unittest -q test_pg_transaction_scenarios_static
python -O -m unittest -q test_pg_transaction_scenarios_static
python -m json.tool pg_transaction_scenarios_offline.json >/dev/null
git hash-object pg_transaction_scenarios_offline.json test_pg_transaction_scenarios_static.py
sha256sum pg_transaction_scenarios_offline.json test_pg_transaction_scenarios_static.py
```

Las 93 pruebas sintéticas anteriores permanecen documentadas en su informe propio; no se reejecutaron en esta fase.

**Sin PostgreSQL, GitHub Actions, OSRM, cartografía, Supabase, staging, producción, código operativo, workflows ni costos.**
