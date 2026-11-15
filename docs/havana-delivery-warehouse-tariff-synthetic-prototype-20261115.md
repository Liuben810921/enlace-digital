# Prototipo sintético offline: almacenes y tarifas de entrega — 2026-11-15

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base:** `400f9b98f64332d0ce7712388a19cc6ad4b8013f`  
**Alcance:** experimento Python separado del sitio operativo; distancias inventadas y sin acceso a cartografía.

## Archivos añadidos

- `experiments/havana-osrm-portable/delivery_quote.py` — Git blob `65d125abe9e62ad039834ff83cb39023604d514d`; SHA-256 `e74d7ba2509333aec61215f0de326861b0062db365620da3f8140f846daad75f`.
- `experiments/havana-osrm-portable/test_delivery_quote.py` — Git blob `d4cd85c2418ebf219dbabaf52ccd1932a6e08a96`; SHA-256 `7f31abfad74c50b288cf42b1797be419ddb02840e2b59a8cbfb02befd989bb35`.

Se verificaron los Git blob SHA-1 publicados contra los archivos locales usados en las pruebas: **2/2 idénticos**.

## Reglas simuladas

- El modelo recibe una lista de identificadores de almacenes y distancias de ruta sintéticas, una por almacén.
- Cuando intervienen varios almacenes, selecciona la distancia máxima para determinar la tarifa al cliente. En empate, selecciona el identificador lexicográficamente mayor, únicamente para resultados deterministas.
- Tarifa de referencia: **200 CUP/km**, distancia mínima facturable **3 km** (mínimo **600 CUP**).
- La tarifa especial opcional sustituye la fórmula general en este prototipo. **La política real de acumulación de tarifas especiales en pedidos con varios productos sigue pendiente de diseño**.
- Utiliza `decimal.Decimal` y redondeo `ROUND_HALF_UP` a centavos de CUP; no emplea floats para calcular importes.
- Entradas inválidas, rutas incompletas, valores negativos/no finitos, almacenes duplicados y cantidades excesivas se rechazan sin generar importe.
- `commercial_approval=false` y `commercial_quote_enabled=false` siempre.

## Pruebas ejecutadas localmente

Directorio aislado `/mnt/data/ed-delivery-offline`, Python del entorno local:

```sh
python -m unittest discover -q
python -O -m unittest discover -q
git hash-object delivery_quote.py test_delivery_quote.py
sha256sum delivery_quote.py test_delivery_quote.py
```

**17/17 correctas en modo normal y 17/17 correctas con `-O`**. Casos: almacén más lejano, mínimo 3 km, empate, tarifa especial, redondeo, rutas faltantes o adicionales, negativos, NaN, infinito, booleanos, duplicados, lista vacía, exceso de almacenes y prohibición de aprobación comercial.

Las 120 pruebas históricas del módulo de comparación OSRM **no se repitieron en esta etapa**. Tampoco se ejecutó GitHub Actions.

## Limitaciones y próximos pasos

1. Distancias **no verificadas geográficamente**. No se ejecutó OSRM ni se descargó cartografía.
2. El modelo no incorpora todavía versiones transaccionales de cesta, dirección, rutas y almacenes, ni invalidación concurrente de cotizaciones.
3. No determina almacenes que realmente surtirán productos; recibe una lista explícita y supone que todos participan. La asignación de inventario/almacenes requiere una política separada.
4. La tarifa especial por producto y su combinación en pedidos mixtos requiere una regla de negocio aprobada antes de integrar.
5. El importe es un resultado sintético de ensayo, **no una cotización al cliente**.
6. Siguiente etapa recomendada: pruebas adversariales de selección por disponibilidad ficticia y versionado de rutas/cesta, manteniendo aislamiento y sin modificar el sitio operativo.

**Sin cambios a `index.html`, workflows, ajustes administrativos, Supabase, staging ni producción. Sin costos, cartografía ni OSRM.**
