# Auditoría estructural adversarial y plan transaccional — 2026-11-15

**Base:** `06d29df57b941ee4277646cd7ccb296749450c11`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Alcance:** solo archivo de pruebas y documentación; sin modificación de prototipos productivos.

## Evidencia de archivos

Se recuperaron por conector GitHub los ocho archivos de la regresión previa, incluyendo `delivery_quote.py`, `warehouse_assignment_v2.py`, `warehouse_state_hardened.py` y cinco archivos de pruebas. Se añadieron 18 casos `unittest` en:

- `experiments/havana-osrm-portable/test_structural_safety_v3.py`
- Blob Git leído después de publicar: `81e62b896e961726868f09499623eba03cfeea1b`.
- Conteo estático verificado: **18 métodos `test_`**; 3 162 caracteres.
- Commit de creación: `4860b1cc9eff03e46f381adbb6a5913a23b6b201`.

Los casos cubren tipos inválidos en inventario anidado, booleanos, negativos, exceso de cantidades, dirección demasiado larga, rutas anidadas, ausencia de rutas tras una modificación, almacenes no hashables, rutas NaN, falta de existencias, invalidación por las cuatro versiones y flags comerciales tanto en éxito sintético como en error.

## Estado de ejecución

**No se ejecutó esta batería nueva en esta sesión.** El contenedor local no puede resolver `raw.githubusercontent.com` (fallo DNS confirmado con `curl`), y el conector GitHub entrega texto al entorno de herramientas pero no una ruta local directamente materializada. Por tanto, no se puede certificar una regresión exacta ni SHA-256 local de los nueve archivos en esta etapa. El Git blob del archivo nuevo sí fue verificado mediante lectura de GitHub; no se afirma equivalencia con un archivo ejecutado.

La regresión anterior de 75 pruebas por modalidad se conserva como antecedente documentado, **no como ejecución repetida**.

## Reproducción exacta pendiente

En un entorno con una copia autorizada de esta rama, sin conexión a servicios empresariales:

```sh
cd experiments/havana-osrm-portable
python -m unittest -q test_delivery_quote test_warehouse_assignment_v2 test_adversarial_extra test_warehouse_state_hardened test_hardened_adversarial_v2 test_structural_safety_v3
python -O -m unittest -q test_delivery_quote test_warehouse_assignment_v2 test_adversarial_extra test_warehouse_state_hardened test_hardened_adversarial_v2 test_structural_safety_v3
git hash-object delivery_quote.py warehouse_assignment_v2.py warehouse_state_hardened.py test_structural_safety_v3.py
sha256sum delivery_quote.py warehouse_assignment_v2.py warehouse_state_hardened.py test_structural_safety_v3.py
```

Se esperan **93 métodos de prueba** (75 previos + 18 nuevos), pero **93/93 NO está verificado**. Cualquier fallo deberá reproducirse antes de corregirlo.

## Plan PostgreSQL desechable — diseño, NO ejecución

1. Preparar una base efímera con datos sintéticos y un rol técnico sin BYPASSRLS; sin secretos empresariales ni red externa.
2. Modelar versiones de `basket`, `address`, `routes` y `warehouses` con actualización condicional atómica, registro inmutable de versión de cotización y restricciones de integridad.
3. Ejecutar dos conexiones controladas: T1 obtiene versiones, T2 modifica una dimensión y confirma, T1 intenta persistir cotización antigua; verificar rechazo y rollback.
4. Repetir carreras para cada dimensión, dos escritores sobre una misma versión, cambios de stock y ruta, cancelación, deadlocks, reintentos acotados y confirmación de resultado desconocido.
5. Probar READ COMMITTED y SERIALIZABLE con aislamiento efectivo, permisos mínimos y RLS; registrar orden de commits y errores SQLSTATE 40001/40P01.
6. Verificar ausencia de cobro aprobado, idempotencia y que ninguna cotización sintética obsoleta resulte vigente; limpieza del esquema al finalizar.
7. No aprovisionar ni ejecutar PostgreSQL, contenedores o GitHub Actions hasta una autorización independiente y evaluación de recursos/costos.

## Límites

No hay distancias geográficas reales, reserva de inventario ni transacciones de base de datos verificadas. El algoritmo de asignación sigue siendo determinista por identificador, no una optimización logística.

**No se ejecutaron Actions, PostgreSQL, OSRM, descargas de cartografía, Supabase, staging, producción ni procesos que generen costos.**
