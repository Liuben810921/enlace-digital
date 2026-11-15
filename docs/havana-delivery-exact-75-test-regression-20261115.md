# Regresión offline integral exacta y validación adversarial de rutas — 2026-11-15

**Base:** b78c37a2a3715c14a1f133e532780bdb228ec539  
**Rama:** plan/havana-osrm-benchmark-offline-20261114  
**Alcance:** Python local, GitHub lectura/escritura exclusivamente de prototipo y documentación.

## Integración exacta inicial

Se recuperaron los contenidos de `delivery_quote.py`, `test_delivery_quote.py`, `warehouse_assignment_v2.py`, `test_warehouse_assignment_v2.py`, `test_adversarial_extra.py`, `warehouse_state_hardened.py` y `test_warehouse_state_hardened.py`. Se cotejó `git hash-object` de los siete archivos locales con sus blobs Git originales, con coincidencia **7/7**.

```sh
cd experiments/havana-osrm-portable
python -m unittest -q test_delivery_quote test_warehouse_assignment_v2 test_adversarial_extra test_warehouse_state_hardened
python -O -m unittest -q test_delivery_quote test_warehouse_assignment_v2 test_adversarial_extra test_warehouse_state_hardened
```

**67/67 OK en ambos modos**. Esto cierra la brecha anterior: ahora sí se ejecutó `warehouse_state_hardened.py` junto con las dependencias exactas del repositorio.

## Hallazgo adversarial demostrado

Se añadieron ocho pruebas para validación temprana de rutas y estado. Antes de la corrección, cuatro pruebas fallaron: `HardenedState.change('routes', ...)` aceptaba NaN, infinito, distancia negativa y distancia superior a 1 000 000 km, incrementando la versión aunque después el cotizador rechazase esos datos. Se confirmó el fallo mediante `unittest` local.

**Corrección:** introducir `_valid_distance` con `decimal.Decimal`, comprobación de finitud y rango [0, 1000000] en `warehouse_state_hardened.py`. Las actualizaciones inválidas ya no modifican el estado ni su versión. El resto de las pruebas incluye rechazo de booleanos, cambio de ruta válido, escritor obsoleto y snapshot con campo inesperado.

## Regresión final exacta

```sh
python -m unittest -q test_delivery_quote test_warehouse_assignment_v2 test_adversarial_extra test_warehouse_state_hardened test_hardened_adversarial_v2
python -O -m unittest -q test_delivery_quote test_warehouse_assignment_v2 test_adversarial_extra test_warehouse_state_hardened test_hardened_adversarial_v2
```

**75/75 OK normal; 75/75 OK con Python -O.**

Los dos archivos nuevos/corregidos fueron publicados y recuperados nuevamente desde GitHub; sus blobs coinciden exactamente con los bytes locales usados en las pruebas:

| Archivo | Git blob verificado | SHA-256 local |
|---|---|---|
| `warehouse_state_hardened.py` | `3d361c0c3d43e497cf3a732b5d2d0cc29b6a721a` | `9272706ce92cb55a01bd69425148c600ddf17f48652d3eade5ecd3fc92544e23` |
| `test_hardened_adversarial_v2.py` | `d99da6f02c42ea436665d44a8ffc376f0afef222` | `69ab491ffd0bde6be17c1c8b2bc56c4055722b676a0def9c94171c95ad7516df` |

Los otros seis archivos de la regresión permanecieron sin cambios.

## Limitaciones

- Son pruebas unitarias sintéticas; no equivalen a concurrencia real entre procesos o transacciones SQL.
- `HardenedState` utiliza encapsulación por convención y copias profundas; no es una frontera de seguridad frente a Python hostil.
- No se han probado rutas reales de La Habana, coberturas geográficas, tarifas especiales mixtas ni asignación comercial.
- No se ejecutaron las 120 pruebas históricas de comparación OSRM en esta fase.
- No se ejecutó PostgreSQL, GitHub Actions, OSRM, cartografía ni ningún servicio empresarial.

**Resultado:** regresión exacta cerrada y defecto adversarial corregido únicamente en prototipo offline. Siguiente etapa: ampliar pruebas de entradas estructurales, cotizaciones obsoletas y especificación transaccional sin infraestructura.
