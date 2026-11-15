# Cierre de regresión exacta: 93 pruebas offline — 2026-11-15

**Base:** `8c00bd3623df8f5539169831f377ffaef2c83fcc`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Ámbito:** exclusivamente artefactos sintéticos locales; sin operaciones empresariales.

## Reconstrucción y trazabilidad

Se reutilizaron los ocho archivos locales del prototipo que ya estaban disponibles en `/mnt/data/ed_exact`. Se comprobó `git hash-object` para cada uno contra los blobs publicados en GitHub. El noveno archivo, `test_structural_safety_v3.py`, se reconstruyó a partir del contenido publicado, y su Git blob `81e62b896e961726868f09499623eba03cfeea1b` coincidió exactamente con el blob leído de GitHub.

| Archivo | Git blob | SHA-256 local |
|---|---|---|
| delivery_quote.py | 65d125abe9e62ad039834ff83cb39023604d514d | e74d7ba2509333aec61215f0de326861b0062db365620da3f8140f846daad75f |
| test_delivery_quote.py | d4cd85c2418ebf219dbabaf52ccd1932a6e08a96 | 7f31abfad74c50b288cf42b1797be419ddb02840e2b59a8cbfb02befd989bb35 |
| warehouse_assignment_v2.py | 2785ee1178db319092aece170d13a94ebead3a99 | 5dd04cc5d07903f45cb98379b57dd0dcfd7e7a18ea386ffee9b2b2b56f809d98 |
| test_warehouse_assignment_v2.py | c92296d5cac99f3a9efaa8e3b3d80bb5381a1089 | 38ee3b1fe83fe7177080af827e4056234428bf5996dc94879ab38fabdceb3df4 |
| test_adversarial_extra.py | 4c968ae3855d5a70c461b71feae5fb01cb0d2f60 | 26b74dac33bd378a408a1431ad598868ecb949de2c8aa34c593d985ad2576d06 |
| warehouse_state_hardened.py | 3d361c0c3d43e497cf3a732b5d2d0cc29b6a721a | 9272706ce92cb55a01bd69425148c600ddf17f48652d3eade5ecd3fc92544e23 |
| test_warehouse_state_hardened.py | a461d402b77456559442f1dde7c4d4d61d1858d5 | 2b0422ddd5750f869057b0c2d5a8c01d3907c80973cd0b4219065318f782b6f5 |
| test_hardened_adversarial_v2.py | d99da6f02c42ea436665d44a8ffc376f0afef222 | 69ab491ffd0bde6be17c1c8b2bc56c4055722b676a0def9c94171c95ad7516df |
| test_structural_safety_v3.py | 81e62b896e961726868f09499623eba03cfeea1b | a1e3a19797b6c6251d7a0191440ee11326de716d7f75f8307a0c2a68a9a09f1d |

**Resultado: nueve de nueve Git blobs coincidentes.** Los SHA-256 se calcularon localmente sobre esos mismos archivos.

## Ejecución reproducible

En el directorio con los nueve archivos:

```sh
python -m unittest discover -q
python -O -m unittest discover -q
python -m compileall -q .
python -O -m compileall -q .
git hash-object *.py
sha256sum *.py
```

Resultados observados:
- `python -m unittest discover -q`: **Ran 93 tests ... OK**.
- `python -O -m unittest discover -q`: **Ran 93 tests ... OK**.
- `compileall` normal y optimizado: **sin errores**.
- **No hubo defectos reproducidos en esta batería y no se modificó el código del prototipo.**

Los 93 casos cubren tarifas mínimas, almacén más lejano, asignación determinista, límites, validación de rutas, estructuras anidadas, snapshots obsoletos, simulaciones de escritores en competencia y flags de aprobación comercial desactivados.

## Límites de la certificación

Las 93 pruebas son unitarias y sintéticas, no pruebas exhaustivas de seguridad ni de concurrencia transaccional real. No certifican cobertura geográfica, datos OSM/OSRM, reservas de inventario, políticas de tarifa especial mixta, rendimiento ni despliegue. El diseño PostgreSQL desechable permanece **documentado y no ejecutado**.

## Próxima etapa segura

Preparar, solo mediante archivos offline, la matriz de intercalaciones de dos conexiones PostgreSQL para cada versión (cesta, dirección, rutas, almacenes), las invariantes de cotización y las condiciones de reversión. Requerirá autorización separada para aprovisionar o ejecutar cualquier base de datos.

**Restricciones cumplidas:** sin GitHub Actions, PostgreSQL, OSRM, cartografía, Supabase, staging, producción, pedidos, clientes, inventario real ni costos.
