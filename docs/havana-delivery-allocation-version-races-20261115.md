# Asignación sintética de almacenes y carreras de versiones — 2026-11-15

**Base:** c9b8651a9ef5536e1ff022a54ac87d02eb02c14e  
**Rama:** plan/havana-osrm-benchmark-offline-20261114  
**Solo experimento:** no se modifica tienda, servicios ni workflows.

## Código publicado

- `experiments/havana-osrm-portable/warehouse_assignment_v2.py` (Git blob `78f05082a0f6ead84f67da9b96b4fb656f7b4f91`).
- `experiments/havana-osrm-portable/test_warehouse_assignment_v2.py` (Git blob `c92296d5cac99f3a9efaa8e3b3d80bb5381a1089`, 27 casos declarados).

El modelo asigna cantidades por SKU en orden de SKU y de identificador de almacén, admite surtido dividido y exige ruta para cada almacén participante. Reutiliza `delivery_quote.quote` para cobrar la distancia mayor y aplicar 3 km/200 CUP por km. Rechaza falta de existencias, distancias no finitas, rutas incompletas y vectores de versión inválidos. La cotización siempre mantiene `commercial_quote_enabled=false` y `commercial_approval=false`.

El simulador `State` usa vectores `basket,address,routes,warehouses`, snapshots y comparación de versión antes/después de la evaluación. Una modificación posterior al snapshot invalida el resultado; dos escritores con la misma versión compiten y solo el primero pasa. **Esto es una simulación secuencial, no concurrencia real con hilos o PostgreSQL.** Tampoco reserva inventario ni verifica rutas reales.

## Evidencia de ejecución y alcance exacto

Se ejecutó en entorno local una implementación preparatoria con 27 pruebas de asignación y carreras simuladas:

- `python -m unittest discover -q`: **27/27 OK**.
- `python -O -m unittest discover -q`: **27/27 OK**.
- Hashes SHA-256 de esos dos archivos preparatorios: `2570ab15ad1c294e6218fa762455efa7fc23594c7b59ffbbd024885b7127a1f0` y `1fa17502a805c5f9d6d67169bbf868e09ed904c4390d5bbc2c041372c7e30df8`.

**Limitación de trazabilidad importante:** los archivos publicados en GitHub son una segunda versión equivalente en alcance pero no idéntica en bytes a los archivos preparatorios ejecutados localmente. Se verificó mediante lectura de GitHub que los dos archivos publicados existen y contienen 27 casos de prueba; **no se ejecutó la versión exacta publicada ni se puede afirmar que sus 27 pruebas pasaron**. No se inventa una certificación de regresión de la versión GitHub. Se requiere ejecutar en un entorno local autorizado, sin Actions, los archivos exactos de GitHub y registrar hashes/resultados antes de dar la etapa por cerrada.

## Reproducción pendiente para los archivos publicados

Desde una copia local de la rama:

```sh
cd experiments/havana-osrm-portable
python -m unittest -q test_delivery_quote test_warehouse_assignment_v2
python -O -m unittest -q test_delivery_quote test_warehouse_assignment_v2
git hash-object warehouse_assignment_v2.py test_warehouse_assignment_v2.py
```

Hashes Git esperados: `78f05082a0f6ead84f67da9b96b4fb656f7b4f91` y `c92296d5cac99f3a9efaa8e3b3d80bb5381a1089`.

## Riesgos pendientes

- El algoritmo greedy elige almacenes por identificador, **no optimiza cantidad de almacenes, costo logístico ni distancia**; debe aprobarse una política de surtido antes de producción.
- No hay persistencia, bloqueo transaccional, atomicidad entre procesos ni protección contra cambios externos durante el cálculo; se requieren pruebas reales de carreras en PostgreSQL desechable, en una fase posterior.
- Las distancias son ficticias; no hay cartografía, cobertura OSRM ni ruta real validada.
- Tarifa especial por producto y combinaciones de artículos grandes no se implementan en esta etapa.

**Sin Supabase, staging, producción, clientes, pedidos, descargas, workflows, despliegues ni costos.**
