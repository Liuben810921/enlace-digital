# Regresión exacta y corrección adversarial — 2026-11-15

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base auditada:** `35af1a32caefa6442beb1a14096d4550e6f1a002`  
**Alcance:** solo Python sintético offline.

## Reproducción exacta del commit base

Se recuperaron por GitHub los contenidos completos de tres archivos y se reconstruyeron localmente byte por byte. `git hash-object` coincidió con los blobs publicados:

| Archivo | Git blob verificado | SHA-256 original |
|---|---|---|
| delivery_quote.py | 65d125abe9e62ad039834ff83cb39023604d514d | e74d7ba2509333aec61215f0de326861b0062db365620da3f8140f846daad75f |
| warehouse_assignment_v2.py | 78f05082a0f6ead84f67da9b96b4fb656f7b4f91 | 58f1f69df5cb6e0d0437e1a058c445473e51b40ef206f8e24d69cceec64ceecd |
| test_warehouse_assignment_v2.py | c92296d5cac99f3a9efaa8e3b3d80bb5381a1089 | 38ee3b1fe83fe7177080af827e4056234428bf5996dc94879ab38fabdceb3df4 |

```sh
python -m unittest -q test_warehouse_assignment_v2
python -O -m unittest -q test_warehouse_assignment_v2
```

**Resultado:** 27/27 OK en ambos modos. Queda cerrada la brecha de ejecución exacta señalada en el informe anterior.

## Defecto real demostrado

En la versión base, `State.change('warehouses', [], versions)` devolvía `True` y aumentaba la versión; después `State.snapshot()` producía `AttributeError: 'list' object has no attribute 'items'`. El problema se reprodujo antes de corregirlo.

**Corrección:** validar tipos de actualización para `basket`, `routes`, `warehouses` y `address` antes de mutar el estado. Un valor malformado devuelve `False` sin alterar versiones. La corrección no modifica el código de la tienda.

## Regresión ampliada tras corrección

Archivos finales publicados y cotejados por Git blob:

- `warehouse_assignment_v2.py`: `2785ee1178db319092aece170d13a94ebead3a99`, SHA-256 `5dd04cc5d07903f45cb98379b57dd0dcfd7e7a18ea386ffee9b2b2b56f809d98`.
- `test_adversarial_extra.py`: `4c968ae3855d5a70c461b71feae5fb01cb0d2f60`, SHA-256 `26b74dac33bd378a408a1431ad598868ecb949de2c8aa34c593d985ad2576d06`.
- `test_warehouse_assignment_v2.py` y `delivery_quote.py`: sin modificaciones.

```sh
python -m unittest -q test_warehouse_assignment_v2 test_adversarial_extra
python -O -m unittest -q test_warehouse_assignment_v2 test_adversarial_extra
```

**Resultado:** 35/35 OK en modo normal y 35/35 OK con `-O`. Ocho casos adicionales: identificador de operación no hashable, aislamiento de snapshot de almacén, fallo de stock sin éxito parcial, ruta NaN, invalidación por dirección, y rechazo de cambios malformados de almacenes, cesta y rutas.

## Límites de la garantía

- La simulación de carreras es secuencial, no transacciones concurrentes reales ni prueba de aislamiento PostgreSQL.
- No se ha auditado exhaustivamente el constructor frente a todas las estructuras de entrada ni el caso de mutación directa de objetos públicos `State.data`/`State.versions`. Esos son riesgos de diseño pendientes.
- El algoritmo de asignación es determinista por identificador, no optimiza rutas, costos ni número de almacenes.
- No se ejecutó toda la batería histórica de 120 pruebas OSRM en esta etapa. No se realizaron pruebas geográficas.
- Sin cartografía, OSRM, Actions, Supabase, staging, producción, datos reales, despliegues ni costos.

**Siguiente etapa:** reforzar encapsulación/validación del estado sintético y preparar una batería de pruebas transaccionales desechables, sin ejecutar ni modificar sistemas empresariales.
